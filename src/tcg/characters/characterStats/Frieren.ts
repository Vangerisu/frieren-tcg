import Character from "../../character";
import Stats from "../../stats";
import { StatsEnum } from "../../stats";
import { frierenDeck } from "../../decks/FrierenDeck";
import { CharacterName } from "../metadata/CharacterName";
import TimedEffect from "../../timedEffect";
import Game from "../../game";
import { CharacterEmoji } from "../../formatting/emojis";

const ANALYSIS_BOOST = 0.05;
const ANALYSIS_STACK_CAP = 10;

const frierenStats = new Stats({
  [StatsEnum.HP]: 100.0,
  [StatsEnum.ATK]: 12.0,
  [StatsEnum.DEF]: 12.0,
  [StatsEnum.SPD]: 12.0,
  [StatsEnum.Ability]: 0.0,
});

const afterAttackEffect = function (game: Game, characterIndex: number) {
  const character = game.getCharacter(characterIndex);
  character.setStat(0, StatsEnum.Ability);
};

export const Frieren = new Character({
  name: CharacterName.Frieren,
  cosmetic: {
    pronouns: {
      possessive: "her",
      reflexive: "herself",
    },
    emoji: CharacterEmoji.FRIEREN,
    color: 0xc5c3cc,
    imageUrl:
      "https://media.discordapp.net/attachments/1346555621952192522/1347399695521026109/Frieren_anime_portrait.webp?ex=67dcd2c0&is=67db8140&hm=0b5f32d66153c8b41d2817170b41b7562e6ef607e9efb1abc220fe5905b7bd77&=&format=webp&width=600&height=600",
  },
  stats: frierenStats,
  cards: frierenDeck,
  ability: {
    abilityName: "Analysis",
    abilityEffectString: `At the end of every turn, gain 1 Analysis stack.
        Whenever an "Analysis" move is used, gain 2 Analysis stacks.
        When an attack is used, its damage is increased by ${ANALYSIS_BOOST * 100}% * the number of Analysis stacks.
        After an attack is used, Analysis stacks is reset to 0.
        A maximum of ${ANALYSIS_STACK_CAP} Analysis stacks can be held at any time.`,
    abilityOnCardUse: function (game, characterIndex, card) {
      const character = game.getCharacter(characterIndex);
      if ("Analysis" in card.tags) {
        character.adjustStat(card.tags["Analysis"], StatsEnum.Ability);
        if (character.stats.stats.Ability > ANALYSIS_STACK_CAP) {
          character.setStat(ANALYSIS_STACK_CAP, StatsEnum.Ability);
        }
      }

      if ("PostAnalysis" in card.tags) {
        character.timedEffects.push(
          new TimedEffect({
            name: "Offensive Magic Analysis: Zoltraak",
            description: `At this turn's resolution, gain ${card.tags["PostAnalysis"]} Analysis stack.`,
            turnDuration: 1,
            endOfTimedEffectAction: (_game, _characterIndex) => {
              console.log("Frieren performed her analysis.");
              character.adjustStat(
                card.tags["PostAnalysis"],
                StatsEnum.Ability,
              );
            },
          }),
        );
      }
    },
    abilityAttackEffect: function (game, characterIndex) {
      const character = game.getCharacter(characterIndex);
      game.additionalMetadata.attackModifier[characterIndex] =
        1 + character.stats.stats[StatsEnum.Ability] * ANALYSIS_BOOST;
    },
    abilityAfterDirectAttackEffect: afterAttackEffect,
    abilityAfterTimedAttackEffect: afterAttackEffect,
    abilityEndOfTurnEffect: function (game, characterIndex) {
      const character = game.getCharacter(characterIndex);
      if (character.stats.stats.Ability < ANALYSIS_STACK_CAP) {
        console.log("Frieren continues her Analysis.");
        character.adjustStat(1, StatsEnum.Ability);
      }
    },
  },
  additionalMetadata: {
    manaSuppressed: true,
    attackedThisTurn: false,
    timedEffectAttackedThisTurn: false,
  },
});
