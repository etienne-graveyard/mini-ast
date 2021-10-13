import { ParseResult } from "./Parser";
import { StringReader } from "./StringReader";

export interface Ast<Value, Ctx> {
  parse(path: Array<string>, input: StringReader, skip: Array<Ast<any, Ctx>>, ctx: Ctx): ParseResult<Value>;
  serialize(value: Value): string;
}

function pipe<Ctx, C1, C2>(c1: Ast<C1, Ctx>, c2: Ast<C2, Ctx>): Ast<[C1, C2], Ctx> {}

type UndefinedKeys<T extends Record<string, any>> = { [K in keyof T]: T[K] extends undefined ? K : never }[keyof T];
type NotUndefinedKeys<T extends Record<string, any>> = { [K in keyof T]: T[K] extends undefined ? never : K }[keyof T];

type MakeUndefinedOptional<T extends Record<string, any>> = { [K in UndefinedKeys<T>]?: T[K] } & { [K in NotUndefinedKeys<T>]: T[K] };

type Keyed<K extends string, A extends Ast<any, Ctx>, Ctx> = {
  key: K;
  ast: A;
};

function key<K extends string, A extends Ast<any, any>>(key: K, ast: A) {
  return { key, ast };
}

type ChildrenBase = Array<Child>;

type ChildrenToObject<C extends ChildrenBase> = ChildrenToObjectLoop<{}, C>;

type Child = Ast<any, any> | Keyed<any, any, any>;

type ChildToObject<C extends Child> = C extends Keyed<infer K, infer A, any>
  ? K extends string
    ? A extends Ast<any, any>
      ? undefined extends AstValue<A>
        ? { [L in K]?: AstValue<A> }
        : { [L in K]: AstValue<A> }
      : {}
    : {}
  : {};

type ChildrenToObjectLoop<Acc, Rest extends ChildrenBase> = Rest extends []
  ? Acc
  : ((...args: Rest) => any) extends (head: infer Head, ...tail: infer Tail) => any
  ? Head extends Child
    ? ChildrenToObjectLoop<Acc & ChildToObject<Head>, Tail extends ChildrenBase ? Tail : []>
    : Head
  : Acc;

type AstValue<A extends Ast<any, any>> = A extends Ast<infer Value, any> ? Value : unknown;

function pipeKeyed<Ctx, Children extends ChildrenBase>(...children: Children): Ast<ChildrenToObject<Children>, Ctx> {
  return {} as any;
}

type Context = {};

const c1: Ast<string | undefined, Context> = {} as any;
const c2: Ast<number, Context> = {} as any;

const res = pipeKeyed(key("first", c1), key("second", c2));

type Node = AstValue<typeof res>;
