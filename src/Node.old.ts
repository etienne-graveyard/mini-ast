import { Parser, ParseResult } from "./Parser";
import { StringReader } from "./StringReader";

type NodeAny = Node<any>;

class Node<Value> {
  protected readonly value: Value;

  constructor(value: Value) {
    this.value = value;
  }

  hasValue(): boolean {
    return {} as any;
  }

  getValue(): Value {
    return {} as any;
  }

  serialize(): string {
    return {} as any;
  }
}

type UndefinedKeys<T extends Record<string, any>> = { [K in keyof T]: T[K] extends undefined ? K : never }[keyof T];
type NotUndefinedKeys<T extends Record<string, any>> = { [K in keyof T]: T[K] extends undefined ? never : K }[keyof T];

type MakeUndefinedOptional<T extends Record<string, any>> = { [K in UndefinedKeys<T>]?: T[K] } & { [K in NotUndefinedKeys<T>]: T[K] };

type ObjectFromTupleAndKeys<Parsed extends Array<NodeAny>, Keys extends Record<string, keyof Parsed>> = MakeUndefinedOptional<{
  [K in keyof Keys]: Parsed[Keys[K]];
}>;

class NodePipe<Value extends Array<NodeAny>, Keys extends Record<string, keyof Value>> extends Node<Value> {
  private readonly keys: Keys;
  private readonly valueObject: ObjectFromTupleAndKeys<Value, Keys>;

  static createFromObject<Parsed extends Array<NodeAny>, Keys extends Record<string, keyof Parsed>>(
    keys: Keys,
    object: ObjectFromTupleAndKeys<Parsed, Keys>
  ): NodePipe<Parsed, Keys> {
    return new NodePipe();
  }

  constructor(value: Value, keys: Keys) {
    super(value);
    this.keys = keys;
    this.valueObject = Object.fromEntries(
      Object.entries(keys).map(([key, index]) => {
        const node: NodeAny = value[index] as any;
        return [key, node.getValue()];
      })
    ) as any;
  }

  getValueObject(): Readonly<ObjectFromTupleAndKeys<Value, Keys>> {
    return this.valueObject;
  }

  getByKey<K extends keyof Keys>(key: K): Value[Keys[K]] {
    return this.value[this.keys[key]];
  }

  serialize(): string {
    return this.value.map((child) => child.serialize()).join("");
  }
}
