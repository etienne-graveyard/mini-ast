import { AstError } from "./AstError";

export class StringReader {
  private readonly input: string;
  private readonly start: number;
  private readonly end: number;
  private readonly direction: number;

  public readonly empty: boolean;
  public readonly position: number;
  public readonly size: number;

  private constructor(input: string, start: number, end: number) {
    this.input = input;
    this.start = start;
    this.end = end;
    this.size = Math.abs(start - end);
    this.direction = (end - start) / this.size; // NaN or 1 or -1
    this.position = this.direction === 1 ? start : end;
    this.empty = this.size <= 0;
  }

  public static create(input: string): StringReader {
    return new StringReader(input, 0, input.length);
  }

  peek(s: number = 1): string {
    const peekSize = Math.min(s, this.size);
    const result = this.input.slice(this.start, this.start + this.direction * peekSize);
    if (s === 1) {
      return result[0] || "";
    }
    return result;
  }

  skip(s: number = 1): StringReader {
    if (s < 1 || s > this.size) {
      throw new AstError.UnexpectedError(`Cannot peek ${s} item`);
    }
    const nextStart = this.start + this.direction * s;
    return new StringReader(this.input, nextStart, this.end);
  }
}
