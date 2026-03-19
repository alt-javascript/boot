/** Property definition — binds a config value to a component property via placeholder resolution. */
const Property = class Property {
  constructor(options) {
    this.name = options?.name;
    this.reference = options?.ref || options?.reference;
    this.value = options?.value;
    this.defaultValue = options?.defaultValue;
  }
};

export default Property;
