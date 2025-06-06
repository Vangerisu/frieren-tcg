import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  InteractionContextType,
} from "discord.js";
import type { Command } from "../../types/command";
import handleAchievementAutocomplete from "./achievementHandler/handleAchievementAutocomplete";
import handleGrantAchievement from "./achievementHandler/handleGrantAchievement";
import { ProgressBarBuilder } from "@src/tcg/formatting/percentBar";
import config from "@src/config";

export const command: Command<ChatInputCommandInteraction> = {
  data: new SlashCommandBuilder()
    .setName("tcg-admin")
    .setDescription("Admin commands for TCG game")
    .setContexts([InteractionContextType.Guild])
    .addSubcommand((subcommand) =>
      subcommand
        .setName("debug-progress-bar")
        .setDescription("Debug the progress bar")
        .addIntegerOption((option) =>
          option
            .setName("value")
            .setDescription("Value of the progress bar")
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("length")
            .setDescription("How many emojis long the progress bar is")
            .setMinValue(4)
            .setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName("max_value")
            .setDescription("Max value of the progress bar")
            .setMinValue(0)
            .setMaxValue(100)
            .setRequired(false)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("grant-achievement")
        .setDescription("Grant an achievement to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to grant the achievement to")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("achievement")
            .setDescription("Achievement to grant")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )

    .addSubcommand((subcommand) =>
      subcommand
        .setName("maintenance")
        .setDescription("Manage maintenance mode")
        .addBooleanOption((option) =>
          option
            .setName("maintenance")
            .setDescription("Enable or disable maintenance mode")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case "grant-achievement":
          await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
          });

          try {
            await handleGrantAchievement(interaction);
            await interaction.editReply({
              content: "Achievement granted successfully.",
            });
          } catch (error) {
            console.error("Error granting achievement:", error);
            await interaction.editReply({
              content: "Failed to grant achievement.",
            });
          }
        case "debug-progress-bar":
          await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
          });

          const maxValue = interaction.options.getInteger("max_value");
          const value = interaction.options.getInteger("value", true);
          const length = interaction.options.getInteger("length");

          try {
            const progressBar = new ProgressBarBuilder()
              .setValue(value)
              .setMaxValue(maxValue ?? 100)
              .setLength(length ?? 12)
              .build();
            const bar = progressBar.barString;

            await interaction.editReply({
              content: `**Progress Bar:**\n${bar}`,
            });
          } catch (error) {
            console.error("Error in progress bar builder:", error);
            await interaction.editReply({
              content: "Failed to build progress bar.",
            });
          }
        case "maintenance":
          await interaction.deferReply({
            ephemeral: true,
          });

          const maintenance = interaction.options.getBoolean(
            "maintenance",
            true
          );
          try {
            config.maintainance = maintenance;
            await interaction.editReply({
              content: `Maintenance mode is now ${
                maintenance ? "enabled" : "disabled"
              }.`,
            });
          } catch (error) {
            console.error("Error in maintenance mode:", error);
            await interaction.editReply({
              content: "Failed to set maintenance mode.",
            });
          }
          break;
        default:
          await interaction.deferReply({
            ephemeral: true,
          });
          await interaction.editReply({
            content: "Invalid subcommand.",
          });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Interaction failed.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  async autocomplete(interaction) {
    try {
      return await handleAchievementAutocomplete(interaction);
    } catch (error) {
      console.error("Error in achievement autocomplete:", error);
      await interaction.respond([]);
    }
  },
};
