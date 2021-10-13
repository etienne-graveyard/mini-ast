import { StringReader } from "./StringReader";
import { AstError } from "./AstError";

export type Parser<T, Ctx> = {
  parse(path: Array<string>, input: StringReader, skip: Array<Parser<any, Ctx>>, ctx: Ctx): ParseResult<T>;
};

export interface Rule<T, Ctx> extends Parser<T, Ctx> {
  setParser(parser: Parser<T, Ctx>): void;
}

export type StackItem = { position: number; name: string; message: string };
export type Stack = Array<StackItem>;

export interface ParseResultFailure {
  type: "Failure";
  name: string;
  message: string;
  pos: number;
  child: ParseResultFailure | null;
}

export interface ParseResultSuccess<T> {
  type: "Success";
  value: T;
  start: number;
  end: number;
  rest: StringReader;
  ifError: ParseResultFailure | null;
}

export type ParseResult<T> = ParseResultSuccess<T> | ParseResultFailure;

export function ParseFailure(
  pos: number,
  path: Array<String>,
  message: string,
  child: ParseResultFailure | null = null
): ParseResultFailure {
  return {
    type: "Failure",
    name: path.join("."),
    message,
    pos,
    child,
  };
}

export function ParseSuccess<T>(
  start: number,
  rest: StringReader,
  value: T,
  ifError: ParseResultFailure | null = null
): ParseResultSuccess<T> {
  return {
    type: "Success",
    rest,
    start,
    end: rest.position,
    value,
    ifError,
  };
}

export function executeParser<T, Ctx>(parser: Parser<T, Ctx>, input: StringReader, ctx: Ctx): ParseResult<T> {
  return parser.parse([], input, [], ctx);
}

export function expectEOF<T>(result: ParseResult<T>): ParseResult<T> {
  if (result.type === "Success") {
    if (result.rest.empty === false) {
      throw new AstError.NotEOF(result.rest);
    }
  }
  return result;
}

export function failurePosition(failure: ParseResultFailure): number {
  if (failure.child === null) {
    return failure.pos;
  }
  if (Array.isArray(failure.child)) {
    return Math.max(...failure.child.map((child) => failurePosition(child)));
  }
  return failurePosition(failure.child);
}

export function failureToStack(failure: ParseResultFailure): Stack {
  const stack: Stack = [];
  let current = failure;
  while (current.child !== null) {
    stack.unshift({
      position: current.pos,
      name: current.name,
      message: current.message,
    });
    current = current.child;
  }
  stack.unshift({
    position: current.pos,
    name: current.name,
    message: current.message,
  });
  return stack;
}

export function stackToString(stack: Stack, indent: number = 0): string {
  const indentText = " ".repeat(indent);
  return stack.map((item) => `${indentText}${item.name}:${item.position} ${item.message}`).join("\n");
}

export type ResultTracker<T> = {
  get(): ParseResult<T>;
  getFailure(): ParseResultFailure | null;
  update(result: ParseResult<T>): void;
};

export function resultTracker<T>(): ResultTracker<T> {
  return new ResultTrackerImpl<T>();
}

/**
 * Keep track of which was the longest result
 */
class ResultTrackerImpl<T> implements ResultTracker<T> {
  private selectedError: { error: ParseResultFailure; pos: number } | null = null;
  private selectedResult: ParseResultSuccess<T> | null = null;

  update(result: ParseResult<T>): void {
    if (result.type === "Failure") {
      const pos = failurePosition(result);
      if (this.selectedError === null || pos > this.selectedError.pos) {
        this.selectedError = { pos, error: result };
      }
    } else {
      if (this.selectedResult === null || result.end > this.selectedResult.end) {
        this.selectedResult = result;
      }
      if (this.selectedResult.ifError) {
        this.update(this.selectedResult.ifError);
      }
    }
  }

  get(): ParseResult<T> {
    if (this.selectedResult) {
      return {
        ...this.selectedResult,
        ifError: this.selectedError?.error ?? null,
      };
    }
    if (this.selectedError) {
      return this.selectedError.error;
    }
    throw new AstError.UnexpectedError(`Tracker did not receive result`);
  }
  getFailure() {
    if (this.selectedError) {
      return this.selectedError.error;
    }
    return null;
  }
}
