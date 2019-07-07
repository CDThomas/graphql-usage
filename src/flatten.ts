function flatten<T>(array: Array<Array<T>>): Array<T> {
  return array.reduce(
    (accumulator: Array<T>, current: Array<T>) => accumulator.concat(current),
    []
  );
}

export default flatten;
