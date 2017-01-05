var speciesSymbol;
var tagSymbol;
// var superSymbol;

if (typeof Symbol === 'undefined') {
    speciesSymbol = '@@species';
    tagSymbol = '@@toStringTag';
    // superSymbol = '@@super';
} else {
    if ('species' in Symbol) {
        speciesSymbol = Symbol.species;
    } else {
        speciesSymbol = Symbol();
    }
    if ('toStringTag' in Symbol) {
        tagSymbol = Symbol.toStringTag;
    } else {
        tagSymbol = Symbol();
    }
    // superSymbol = Symbol();
}

var listKeys = (function() {
    // function getAllEnumerableKeys(object) {
    //     return Object.keys(object);
    // }

    function getAllKeys(object) {
        return Object.getOwnPropertyNames(object);
    }

    function getAllKeysAndSymbols(object) {
        return getAllKeys(object).concat(Object.getOwnPropertySymbols(object));
    }

    var listKeys = Object.getOwnPropertySymbols ? getAllKeysAndSymbols : getAllKeys;

    return listKeys;
})();

function defineAllPropertyOn(owner, target) {
    if (typeof owner !== 'object' || owner === null) {
        throw new TypeError('owner must be an object');
    }

    var keys = listKeys(owner);
    var keyIndex = 0;
    var keyLength = keys.length;
    for (;keyIndex < keyLength; keyIndex++) {
        definePropertyOn(owner, keys[keyIndex], target);
    }
}

function definePropertyOn(owner, name, target) {
    if (typeof owner !== 'object') {
        throw new Error('definePropertyOn first argument must be an object');
    }
    if (typeof target !== 'object') {
        throw new Error('definePropertyOn third argument must be an object');
    }

    var descriptor = Object.getOwnPropertyDescriptor(owner, name);

    if (name === 'constructor') {
        let constructor = descriptor.value;

        if (typeof constructor !== 'function') {
            throw new TypeError('object.constructor must be a function');
        }
        // idéalement il faudrais s'assure qu'aucun constructeur n'est appelé plusieurs fois
        // et pas seulement base.constructor
        // if (constructor === Object.getPrototypeOf(target).constructor) {
        //     throw new Error('object.constructor must not be the same as superObject.constructor');
        // }
        if (target.hasOwnProperty('constructor')) {
            constructor = combineConstructor(constructor, target.constructor);
            descriptor.value = constructor;
        }
        linkConstructorAndPrototype(constructor, target);
    }

    Object.defineProperty(target, name, descriptor);
}

function combineConstructor(firstConstructor, secondConstructor) {
    const combinedConstructor = function combinedConstructor() {
        let instance = this;
        const firstConstructorReturnValue = firstConstructor.apply(instance, arguments);
        instance = instanceOrConstructorReturnValue(instance, firstConstructorReturnValue);
        const secondConstructorReturnValue = secondConstructor.apply(instance, arguments);
        instance = instanceOrConstructorReturnValue(instance, secondConstructorReturnValue);
        return instance;
    };
    return combinedConstructor;
}

function instanceOrConstructorReturnValue(instance, returnValue) {
    if (returnValue === null) {
        return instance;
    }
    if (typeof returnValue === 'object') {
        return returnValue;
    }
    return instance;
}

function linkConstructorAndPrototype(constructor, prototype) {
    constructor.prototype = prototype;
    prototype[speciesSymbol] = constructor;
    // constructor[superObject] = superObject;
}

function createComposer(firstArg) {
    var base;
    if (firstArg instanceof Function) {
        base = firstArg.prototype;
        // defineProperties(object, pure);
    } else if (typeof firstArg === 'object') {
        base = firstArg;
    } else {
        throw new TypeError('createComposer first argument must be a function or an object');
    }

    var createRawComposite = function() {
        return Object.create(base);
    };

    var superConstructor = base.constructor;

    var compose = function() {
        var composite = createRawComposite();

        var firstComponent = this;
        defineAllPropertyOn(firstComponent, composite);

        var args = arguments;
        var i = 0;
        var j = args.length;
        if (j > 0 && typeof args[0] === 'string') {
            i = 1;
            composite[tagSymbol] = args[0];
        }
        for (;i < j; i++) {
            defineAllPropertyOn(arguments[i], composite);
        }

        // ensure composite has a constructor
        if (Object.prototype.hasOwnProperty.call(composite, 'constructor') === false) {
            const constructorProxy = function constructorProxy() {
                return superConstructor.apply(this, arguments);
            };
            definePropertyOn(
                {
                    constructor: constructorProxy
                },
                'constructor',
                composite
            );
        }
        composite.compose = compose.bind(composite);

        return composite;
    };

    return compose;
}

var construct = (function() {
    var construct;

    // https://github.com/zloirock/core-js/blob/v2.4.1/modules/es6.reflect.construct.js
    if (Reflect && 'construct' in Reflect) {
        construct = Reflect.construct;
    } else {
        // https://gist.github.com/dmail/6e639ac50cec8074a346c9e10e76fa65
        var ProxiedConstructor;
        var ConstructorProxy = function(args) {
            return ProxiedConstructor.apply(this, args);
        };

        return function(Constructor, args/* , instanceConstructor */) {
            var instance;

            switch (args.length) {
                case 0:
                    instance = new Constructor();
                    break;
                case 1:
                    instance = new Constructor(args[0]);
                    break;
                case 2:
                    instance = new Constructor(args[0], args[1]);
                    break;
                default:
                    ProxiedConstructor = Constructor;
                    ConstructorProxy.prototype = Constructor.prototype;
                    instance = new ConstructorProxy(args);
                    ConstructorProxy.prototype = null;
                    break;
            }

            if (arguments.length > 2) {
                instance.constructor = arguments[2];
            }

            return instance;
        };
    }

    return construct;
})();

const objectCompose = createComposer(Object.prototype);
const baseComponent = objectCompose.call({
    tagSymbol: tagSymbol,

    create() {
        return construct(this.constructor, arguments);
    },

    createConstructor() {
        return construct(this[speciesSymbol] || this.constructor, arguments);
    }
});
const baseComponentCompose = baseComponent.compose;

export default baseComponentCompose;
