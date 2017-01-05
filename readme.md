# Compose

Basic object composer.

## Example

This is a very basic object composer used to create prototype used as class.
- calling compose() returns a `composite`
- Every call to compose() create a new composite (immutability)
- A composite is a JavaScript object with two main methods: `compose` & `create`
- constructor methods are combined together
- The create method of a composite create and returns an instance of the composite

```javascript
import compose from '@jsenv/compose';

const User = compose({
	constructor() {
		this.items = [];
	}
});
const CompositeUser = User.compose({
	constructor() {
		this.items.push({name: 'sword'});
	}
});

const compositeUser = CompositeUser.create();
compositeUser.items[0].name; // 'sword'
Object.getPrototypeOf(compositeUser) === CompositeUser; // true
```
