import { Stack, stackToString } from "./Parser";
import { StringReader } from "./StringReader";

export class AstError extends Error {
  constructor(message: string) {
    super(message); // 'Error' breaks prototype chain here
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }

  public static ParsingError: typeof ParsingError;
  public static NotEOF: typeof NotEOF;
  public static UnexpectedError: typeof TSQliteUnexpectedError;
  public static ParserNotImplemented: typeof ParserNotImplemented;
  // public static NotImplementedError: typeof DocsyNotImplementedError;
  // public static CannotTransformValueError: typeof DocsyCannotTransformValueError;
  // public static MissingGlobalError: typeof DocsyMissingGlobalError;
  // public static CannotResolveInjectError: typeof DocsyCannotResolveInjectError;
  // public static CannotResolveNodeError: typeof DocsyCannotResolveNodeError;
  // public static MissingJsxFunctionError: typeof DocsyMissingJsxFunctionError;
  // public static CannotSerializeNodeError: typeof DocsyCannotSerializeNodeError;
}

class TSQliteUnexpectedError extends AstError {
  constructor(message: string) {
    super(`Unexpected: ${message}`);
  }
}

class ParsingError extends AstError {
  constructor(public parsingStack: Stack) {
    super(`Parsing error:\n${stackToString(parsingStack, 2)}`);
  }
}

class NotEOF extends AstError {
  constructor(public rest: StringReader) {
    super(
      `Expectinf EOF but rest: ${(() => {
        const restText = rest.peek(Infinity);
        if (restText.length < 20) {
          return `"${restText}"`;
        }
        return `"${restText.slice(0, 17)}..."`;
      })()}`
    );
  }
}

class ParserNotImplemented extends AstError {
  constructor(public parserName: string) {
    super(`Cannot get parser rule "${parserName}": no parser defined !`);
  }
}

AstError.ParsingError = ParsingError;
AstError.NotEOF = NotEOF;
AstError.UnexpectedError = TSQliteUnexpectedError;
AstError.ParserNotImplemented = ParserNotImplemented;
