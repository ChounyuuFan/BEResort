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

Array.prototype.random = function () {
    return this[Random.nextInt(0, this.length - 1)];
};