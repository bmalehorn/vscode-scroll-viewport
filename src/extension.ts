import * as vscode from "vscode";
import { Position, Range, Selection } from "vscode";

type Direction = "down" | "up";

/**
 *
 * @param lines how many lines of code to scroll down
 * @param direction "up" or "down"
 * @returns Where the screen should move to - the line number of the top of the
 * screen and bottom of the screen. Rather complicated as it takes into account code folding.
 */
const calculateLimits = (
  lines: number,
  direction: Direction,
): { top: number; bottom: number } => {
  const editor = vscode.window.activeTextEditor!;
  const { visibleRanges } = editor;
  if (direction === "down") {
    const bottom = Math.min(
      visibleRanges[visibleRanges.length - 1].end.line + lines,
      editor.document.lineCount,
    );

    const startTop = visibleRanges[0].start.line;
    const linesToAdd =
      bottom - visibleRanges[visibleRanges.length - 1].end.line;
    const top = foldingAwareAddLines(startTop, linesToAdd, "down");

    return { top, bottom };
  } else if (direction === "up") {
    // 1. top <=> bottom
    // 2. 0 ... visibleRanges.length <=> visibleRanges.length ... 0
    // 3. + <=> -
    // 4. start <=> end
    // it's probably possible to use the same code for up & down,
    // but I'd rather have it inlined, out in the open
    const top = Math.max(visibleRanges[0].start.line - lines, 0);

    const startBottom = visibleRanges[visibleRanges.length - 1].end.line;
    const linesToAdd = visibleRanges[0].start.line - top;
    const bottom = foldingAwareAddLines(startBottom, linesToAdd, "up");

    return { top, bottom };
  }

  return { top: 0, bottom: 0 };
};

const foldingAwareAddLines = (
  startLine: number,
  linesToAdd: number,
  direction: Direction,
): number => {
  let linesRemaining = linesToAdd;
  const editor = vscode.window.activeTextEditor!;
  const { visibleRanges } = editor;
  let line = startLine;

  if (direction === "down") {
    let i = 0;
    while (linesRemaining > 0 && i < visibleRanges.length) {
      const range = visibleRanges[i];
      const toBurn = Math.min(range.end.line - line, linesRemaining);
      linesRemaining -= toBurn;
      line += toBurn;
      i++;
      // burn 1 line to reach next visible range
      if (linesRemaining > 0 && i < visibleRanges.length) {
        linesRemaining--;
        line = visibleRanges[i].start.line;
      }
    }
    line += linesRemaining;
    return line;
  } else if (direction === "up") {
    let i = visibleRanges.length - 1;

    while (linesRemaining > 0 && i >= 0) {
      const range = visibleRanges[i];
      const toBurn = Math.min(line - range.start.line, linesRemaining);
      linesRemaining -= toBurn;
      line -= toBurn;
      i--;
      // burn 1 line to reach next visible range
      if (linesRemaining > 0 && i >= 0) {
        linesRemaining--;
        line = visibleRanges[i].end.line;
      }
    }
    line -= linesRemaining;
    return line;
  }
  throw Error(`unimplemented direction ${direction}`);
};

// You can set editor.cursorSurroundLines: 10 to always leave 10 lines between
// your cursor and the top of the viewport.

// However, vscode has undocumented behavior that if you set this number too low
// (including the default value of 0), it will actually round up to
// `VSCODE_AUTO_SURROUND_LINES_TOP` revealed space at the top. Same with
// `VSCODE_AUTO_SURROUND_LINES_BOTTOM` at the bottom.

// these functions calculate this *effective* value of
// editor.cursorSurroundingLines, so we can compensate for it when requesting a
// scroll range.
const VSCODE_AUTO_SURROUND_LINES_TOP = 5;
const VSCODE_AUTO_SURROUND_LINES_BOTTOM = 1;

const calculateLimitsWithSurroundLines = (
  direction: Direction,
): { top: number; bottom: number } => {
  const lines = vscode.workspace
    .getConfiguration("scrollViewport")
    .get<number>("lines", 10);
  let { top, bottom } = calculateLimits(lines, direction);

  const cursorSurroundLines = vscode.workspace
    .getConfiguration("editor")
    .get<number>("cursorSurroundingLines", 0);
  const surroundLinesTop = Math.max(
    cursorSurroundLines,
    VSCODE_AUTO_SURROUND_LINES_TOP,
  );
  const surroundLinesBottom = Math.max(
    cursorSurroundLines,
    VSCODE_AUTO_SURROUND_LINES_BOTTOM,
  );
  top = foldingAwareAddLines(top, surroundLinesTop, "down");
  bottom = foldingAwareAddLines(bottom, surroundLinesBottom, "up");
  return { top, bottom };
};

const scrollDown = () => {
  const editor = vscode.window.activeTextEditor!;

  const { top, bottom } = calculateLimitsWithSurroundLines("down");

  // update viewport - reveal bottom
  const bottomPosition = new Position(bottom, 0);
  editor.revealRange(new Selection(bottomPosition, bottomPosition));

  // update cursor - move to top
  const topPosition = new Position(top, 0);
  confineCursorToViewportIfEnabled(new Range(topPosition, bottomPosition));
};

const scrollUp = () => {
  const editor = vscode.window.activeTextEditor!;

  const { top, bottom } = calculateLimitsWithSurroundLines("up");

  // update viewport - reveal top
  const topPosition = new Position(top, 0);
  editor.revealRange(new Selection(topPosition, topPosition));

  // update cursor - move to bottom
  const bottomPosition = new Position(bottom, 0);
  confineCursorToViewportIfEnabled(new Range(bottomPosition, topPosition));
};

const confineCursorToViewportIfEnabled = (range: Range) => {
  const editor = vscode.window.activeTextEditor!;
  // put active inside new revealed range
  if (editor.selection.active.compareTo(range.start) < 0) {
    const newPosition = range.start.with(range.start.line, 0);
    editor.selection = new Selection(
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
  if (editor.selection.active.compareTo(range.end) > 0) {
    const newPosition = range.end.with(range.end.line, 0);
    editor.selection = new Selection(
      selecting() ? editor.selection.anchor : newPosition,
      newPosition,
    );
  }
};

const selecting = (): boolean => {
  return vscode.window.activeTextEditor!.selections.some(
    selection => !selection.anchor.isEqual(selection.active),
  );
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  context.subscriptions.push(
    vscode.commands.registerCommand("scrollViewport.scrollDown", scrollDown),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("scrollViewport.scrollUp", scrollUp),
  );
}

// this method is called when your extension is deactivated
// tslint:disable-next-line: no-empty
export function deactivate() {}
