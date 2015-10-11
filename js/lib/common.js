Math.avg = function () {
    if (arguments.length == 0)
        return;

    var sum = 0;
    for (var i = 0; i < arguments.length; i++) {
        sum += arguments[i];
    }
    return sum / arguments.length;
};
Math.clamp = function (value, min, max) {
    return Math.max(Math.min(value, max), min);
};

var Random = {
    nextInt: function (min, max) {
        // This is a VERY BAD way of getting random integers!  Edge values (min/max) 
        // carry half the weight of numbers inbetween.  This is EXTREMELY noticible 
        // if you request a 3-digit wide random.  The middle value will occur twice 
        // as often as the min and max values (50% vs 25% vs 25%) rather than the 
        // expected 33% vs 33% vs 33% distribution.
        return Math.round(Random.nextFloat(min, max));
    },

    nextFloat: function (min, max) {
        if (typeof (min) === "undefined" && typeof (max) === "undefined")
            return Math.random();

        var diff = max - min;
        return Math.random() * diff + min;
    }
};

Date.prototype.getMillisecondDifference = function (date) {
    return this.getTime() - date.getTime();
};

Array.prototype.random = function () {
    return this[Random.nextInt(0, this.length - 1)];
};

var Debug = {
    TimeFunction: function (callback) {
        var returnValue;

        var startTime = new Date();
        returnValue = callback();
        var runTime = (new Date()).getMillisecondDifference(startTime);

        console.log("Function ran for: " + runTime + " milliseconds");
        return returnValue;
    }
}

function WeightedRandomItemPicker(weightedItems) {
    this.items = weightedItems;
    this.totalWeight = 0;
    this.updateTotalWeight();
}
WeightedRandomItemPicker.prototype.updateTotalWeight = function () {
    var totalWeight = 0;
    for (var i = 0; i < this.items.length; i++) {
        totalWeight += this.items[i].weight;
    }
    this.totalWeight = totalWeight;
};
WeightedRandomItemPicker.prototype.random = function () {
    var weightedIndex = Random.nextFloat(0, this.totalWeight);
    var remainingWeight = weightedIndex;
    var index = 0;
    for (; index < this.items.length; index++) {
        remainingWeight -= this.items[index].weight;
        if (remainingWeight <= 0)
            break;
    }
    return this.items[index];
};

function WeightedRandomItem(value, weight) {
    this.value = value;
    this.weight = !!weight ? weight : 1;
}

var ArrayHelpers = (function () {
    function createDictionaryArray(elements, keyValueFunction) {
        var returnValue = [];
        for (var i = 0; i < elements.length; i++) {
            var key = keyValueFunction(elements[i]);

            // Add a property that links to the matching values array
            if (returnValue[key])
                returnValue[key].push(elements[i])
            else {
                returnValue[key] = [];

                // Add a keyed item to the array, reusing the values array created above.
                returnValue.push({
                    key: key,
                    values: returnValue[key]
                });
            }
        }

        // Sort array by key, destroying the existing key properties
        returnValue = returnValue.sort(function (a, b) {
            if (a.key == b.key)
                return 0;
            return a.key > b.key ? 1 : -1;
        });

        // Recreate the key properties
        for (var i = 0; i < returnValue.length; i++) {
            returnValue[returnValue[i].key] = returnValue[i].values;
        }

        return returnValue;
    }

    function compareProperties(a, b, propertyNames) {
        for (var i = 0; i < propertyNames.length; i++) {
            var propName = propertyNames[i];

            if(typeof(a[propName]) == "undefined" || typeof(b[propName]) == "undefined")
                continue;

            if (a[propName] > b[propName])
                return 1;
            else if (a[propName] < b[propName])
                return -1;
        }

        return 0;
    }

    return {
        compareProperties: compareProperties,
        createDictionaryArray: createDictionaryArray
    };
})();