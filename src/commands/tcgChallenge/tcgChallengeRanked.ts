import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  InteractionContextType,
} from "discord.js";
import type { Command } from "../../types/command";
import { initiateChallengeRequest } from "./gameHandler/initiateChallengeRequest";
import { GAME_SETTINGS, GameMode } from "./gameHandler/gameSettings";

export const command: Command<ChatInputCommandInteraction> = {
  data: new SlashCommandBuilder()
    .setName("tcg-ranked-challenge")
    .setDescription("Challenge another user to a Ranked duel!")
    .setContexts([InteractionContextType.Guild])
    .addUserOption((option) =>
      option
        .setName("opponent")
        .setDescription("The user you want to challenge")
    )
    .addStringOption((option) =>
      option
        .setName("gamemode")
        .setDescription("Select the gamemode. Defaults to Classic.")
        .setRequired(false)
        .addChoices(
          Object.entries(GAME_SETTINGS)
            .filter(([, game]) => game.optionName && game.allowedOption)
            .map(([key, game]) => ({
              name: game.optionName ?? "optionName should be defined",
              value: key,
            }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const gamemode =
        (interaction.options.getString("gamemode") as GameMode) ??
        GameMode.CLASSIC;
      const gameSettings = GAME_SETTINGS[gamemode];

      initiateChallengeRequest({
        interaction,
        gameSettings,
        ranked: true,
        gamemode,
      });
    } catch (error) {
      console.log(error);
      await interaction.reply({
        content: "Failed to start game.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
