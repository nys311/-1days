import { useCallback, useState } from "react";
import type { PlayTarget } from "@minus1days/shared";
import { sendAction } from "./socket";

export type BuilderKind = "PLAY_CARD" | "PREPARE_SELF" | null;

export interface ComposerState {
  builder: BuilderKind;
  cardInstanceId: string | null;
  faceUp: boolean;
  awaitingPlayerTarget: boolean;
}

const initial: ComposerState = { builder: null, cardInstanceId: null, faceUp: true, awaitingPlayerTarget: false };

/**
 * Drives the "pick a card -> choose face up/down -> choose target" flow for
 * PLAY_CARD (and the simpler self-only PREPARE_SELF). Target selection for
 * `{kind:"PLAYER"}` is done by clicking a seat on the Table page — this hook just
 * exposes `awaitingPlayerTarget` so the page knows when to make seats clickable.
 */
export function useActionComposer(roomId: string | null) {
  const [state, setState] = useState<ComposerState>(initial);

  const startPlayCard = useCallback((cardInstanceId: string) => {
    setState({ builder: "PLAY_CARD", cardInstanceId, faceUp: true, awaitingPlayerTarget: false });
  }, []);

  const startPrepareSelf = useCallback((cardInstanceId: string) => {
    setState({ builder: "PREPARE_SELF", cardInstanceId, faceUp: true, awaitingPlayerTarget: false });
  }, []);

  const setFaceUp = useCallback((faceUp: boolean) => setState((s) => ({ ...s, faceUp })), []);

  const beginPlayerTargeting = useCallback(() => setState((s) => ({ ...s, awaitingPlayerTarget: true })), []);

  const cancel = useCallback(() => setState(initial), []);

  const confirmTarget = useCallback(
    (target: PlayTarget) => {
      if (!roomId || !state.cardInstanceId || !state.builder) return;
      if (state.builder === "PREPARE_SELF") {
        sendAction(roomId, { type: "PREPARE_SELF", cardInstanceId: state.cardInstanceId });
      } else {
        sendAction(roomId, {
          type: "PLAY_CARD",
          cardInstanceId: state.cardInstanceId,
          faceUp: state.faceUp,
          target,
        });
      }
      setState(initial);
    },
    [roomId, state]
  );

  /** RANSOMWARE/ZERODAY: the real target is a specific card elsewhere on the table, not a
   * player/server/kern zone — `target` is a required-but-ignored placeholder for those subtypes. */
  const confirmCardTarget = useCallback(
    (targetCardInstanceId: string) => {
      if (!roomId || !state.cardInstanceId || state.builder !== "PLAY_CARD") return;
      sendAction(roomId, {
        type: "PLAY_CARD",
        cardInstanceId: state.cardInstanceId,
        faceUp: true,
        target: { kind: "SERVER" },
        targetCardInstanceId,
      });
      setState(initial);
    },
    [roomId, state]
  );

  return { state, startPlayCard, startPrepareSelf, setFaceUp, beginPlayerTargeting, cancel, confirmTarget, confirmCardTarget };
}

export type ActionComposer = ReturnType<typeof useActionComposer>;
