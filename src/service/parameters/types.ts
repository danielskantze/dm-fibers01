export class ModifierException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ModifierTypeException extends ModifierException {
  constructor(message: string) {
    super(message);
  }
}

export class ModifierRangeException extends ModifierException {
  constructor(message: string) {
    super(message);
  }
}
