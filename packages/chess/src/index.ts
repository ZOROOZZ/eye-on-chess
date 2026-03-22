export { REACTIONS, VALID_REACTIONS, type ReactionType } from "./reactions.js";

export type Color = "white" | "black";

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

export interface Piece {
  color: Color;
  type: PieceType;
}
