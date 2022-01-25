// Type helpers, better than Object functions with TypeScript

export function buildObjectFromEntries<T extends [key: string, value: any]>(
  entries: T[]
): {
  [key in T[0]]: T[1];
} {
  let object: {
    [key in T[0]]: T[1];
  };
  let entry: T;

  for (entry of entries) {
    object = {
      // @ts-ignore
      ...object,
      [entry[0]]: entry[1],
    };
  }

  // @ts-ignore
  return object;
}
