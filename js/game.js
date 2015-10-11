/// <reference path="~/js/lib/jquery.js" />
/// <reference path="~/js/lib/ko.js" />
/// <reference path="~/js/lib/common.js" />

////////////////////////////////////
// Constants & General Data Types //
////////////////////////////////////
function MessageInfo(message, type, priority) {
    this.message = message ? message : "";
    this.type = type ? type : "";
    this.priority = priority ? priority : 0;
    this.timestamp = {
        day: Game.currentDay(),
        tick: Game.currentTick()
    };
}

var MessageTypes = {
    "Info": 0,
    "Milk": 1,
    "Amenity": 2
};

var ResortRoomTypes = {
    "Beach": 1,
    "Gym": 2,
    "Spa": 4,
    "Lounge": 8,
    "Theater": 16,
    "Nursing Room": 32,
    "All": 63
};

(function () {
    function createReverseLookup(objectToPopulate) {
        var valueList = [];
        for (var prop in objectToPopulate) {
            if (!objectToPopulate.hasOwnProperty(prop))
                continue;

            objectToPopulate[objectToPopulate[prop]] = prop;
            valueList.push(prop);
        }
        objectToPopulate.valueList = valueList;
    }

    function isType(a, b) {
        if ((typeof (a)).toLowerCase() != "number")
            a = this[a];

        if ((typeof (b)).toLowerCase() != "number")
            b = this[b];

        return !!(a & b);
    }

    // Create reverse lookups for easy use
    createReverseLookup(MessageTypes);
    createReverseLookup(ResortRoomTypes);

    MessageTypes.isType = isType;
    ResortRoomTypes.isType = isType;
})();

function AmenitiesValue(relax, athletic, pamper) {
    this.relax = relax ? relax : 0;
    this.athletic = athletic ? athletic : 0;
    this.pamper = pamper ? pamper : 0;
}
AmenitiesValue.prototype.valueNames = ["relax", "athletic", "pamper"];
AmenitiesValue.prototype.add = function (value) {
    return new AmenitiesValue(this.relax + value.relax, this.athletic + value.athletic, this.pamper + value.pamper);
};
AmenitiesValue.prototype.subtract = function (value) {
    return new AmenitiesValue(this.relax - value.relax, this.athletic - value.athletic, this.pamper - value.pamper);
};
AmenitiesValue.prototype._createRandomValue = function (totalPoints) {
    var amenityValue = new AmenitiesValue();
    while (totalPoints > 0) {
        var currentValueName = this.valueNames.random();

        var valueToAdd = Random.nextInt(1, totalPoints);
        totalPoints -= valueToAdd;
        amenityValue[currentValueName] += valueToAdd;
    }
    return amenityValue;
};

function ResortUpgradeBase(name, price, upkeep, owningRoomType) {
    this.name = ko.observable(name);
    this.price = ko.observable(price);
    this.upkeep = ko.observable(upkeep);
    this.description = ko.observable(null);
    this.owningRoomType = ko.observable(owningRoomType);
    this.amenityValue = ko.observable(null);

    this.purchased = ko.observable(false);
    this.enabled = ko.observable(false);
}
ResortUpgradeBase.prototype.buy = function () {
    Game.money(Game.money() - this.price());
    this.purchased(true);
    this.enabled(true);
};


/////////////////
// Message Log //
/////////////////
function MessageLog() {
    this.logLength = 50;
    this.log = ko.observableArray([]);
}
MessageLog.prototype.add = function (message) {
    /// <param name="message" type="MessageInfo" />
    this.log.splice(0, 0, message);
    while (this.log.length > this.logLength)
        this.log.splice(50, 1);
};
MessageLog.prototype.createAdd = function (messageText) {
    return this.add(new MessageInfo(messageText));
};

///////////////////
// Game & Resort //
///////////////////
function Resort() {
    this.upgrades = ko.observableArray();
    this._loadUpgrades();

    this.totalUpkeep = ko.observable();
    this.totalAmenitiesValue = ko.computed(this._calculateAmentityValue, this);
}
(function () {
    Resort.prototype._calculateAmentityValue = function () {
        var sum = new AmenitiesValue(0, 0, 0);
        var upgrades = this.upgrades();
        var upkeep = 0;

        for (var i = 0; i < upgrades.length; i++) {
            if (!upgrades[i].purchased() | !upgrades[i].enabled())
                continue;

            sum = sum.add(upgrades[i].amenityValue());
            upkeep += upgrades[i].upkeep();
        }

        this.totalUpkeep(upkeep);
        return sum;
    };
    Resort.prototype._loadUpgrades = function () {
        this.upgrades.splice(0);

        // Beach
        var volleyball = new ResortUpgradeBase("Volleyball", 1000, 10, ResortRoomTypes.Beach);
        volleyball.description("A beach volleyball court for the sea side.");
        volleyball.amenityValue(new AmenitiesValue(0, 1, 0));
        this.upgrades.push(volleyball);

        var sunbathing = new ResortUpgradeBase("Sunbathing", 500, 20, ResortRoomTypes.Beach);
        sunbathing.description("Towels, umbrellas, and sunscreen for relaxing on the beach.");
        sunbathing.amenityValue(new AmenitiesValue(2, 0, 0));
        this.upgrades.push(sunbathing);

        var lifeguard = new ResortUpgradeBase("Life Guard", 750, 80, ResortRoomTypes.Beach);
        lifeguard.description("A life guard to watch the beach and allow customers to safely swim.");
        lifeguard.amenityValue(new AmenitiesValue(2, 1, 1));
        this.upgrades.push(lifeguard);

        var beachBar = new ResortUpgradeBase("Beach Bar", 1500, 100, ResortRoomTypes.Beach);
        beachBar.description("A full service beach side bar, complete with tiny umbrella drinks.");
        beachBar.amenityValue(new AmenitiesValue(2, 0, 3));
        this.upgrades.push(beachBar);

        // Gym
        var treadmills = new ResortUpgradeBase("Treadmills", 1000, 30, ResortRoomTypes.Gym);
        treadmills.description("Treadmills for keeping that cardio up!");
        treadmills.amenityValue(new AmenitiesValue(0, 2, 0));
        this.upgrades.push(treadmills);

        var weights = new ResortUpgradeBase("Weights", 500, 20, ResortRoomTypes.Gym);
        weights.description("Free weights for toning and shaping.");
        weights.amenityValue(new AmenitiesValue(0, 1, 0));
        this.upgrades.push(weights);

        var yoga = new ResortUpgradeBase("Yoga", 650, 35, ResortRoomTypes.Gym);
        yoga.description("Yoga mats and instruction.");
        yoga.amenityValue(new AmenitiesValue(1, 1, 0));
        this.upgrades.push(yoga);

        // Spa
        var hotTub = new ResortUpgradeBase("Hot Tub", 1200, 35, ResortRoomTypes.Spa);
        hotTub.description("Don't worry so much, just give the water a touch.");
        hotTub.amenityValue(new AmenitiesValue(1, 0, 1));
        this.upgrades.push(hotTub);

        var sauna = new ResortUpgradeBase("Sauna", 2000, 75, ResortRoomTypes.Spa);
        sauna.description("Hot and steamy.");
        sauna.amenityValue(new AmenitiesValue(2, 0, 3));
        this.upgrades.push(sauna);

        var masseuse = new ResortUpgradeBase("Masseuse", 1000, 100, ResortRoomTypes.Spa);
        masseuse.description("Nothing beats a good massage.");
        masseuse.amenityValue(new AmenitiesValue(1, 0, 4));
        this.upgrades.push(masseuse);

        var pool = new ResortUpgradeBase("Indoor Pool", 5000, 50, ResortRoomTypes.Spa);
        pool.description("An indoor temperature controlled pool.");
        pool.amenityValue(new AmenitiesValue(2, 0, 2));
        this.upgrades.push(pool);

        // Lounge

    };

    Resort.prototype.getUpgradesByRoom = function (resortRoomType) {
        return $.grep(this.upgrades(), function (item, index) {
            return ResortRoomTypes.isType(item.owningRoomType(), resortRoomType);
        });
    };
})();

var Game = (function () {

    function Game() {
        /// <field name="worldInfo" type="WorldInfo" />
        /// <field name="resort" type="Resort" />
        /// <field name="availableContracts" type="Array" elementType="Contracts.CustomerContractBase" />

        this.settings = {
            daySettings: {
                totalTicksPerDay: 24,
                activeTicksPerDay: 16,
                wakeHour: 8
            },
            contractLimit: 10,
            customerLimit: 4
        };

        this.money = ko.observable(9500);
        this.chem = ko.observable(0);
        this.currentTick = ko.observable(0);
        this.currentDay = ko.observable(1);
        this.customers = ko.observableArray();
        this.messageLog = new MessageLog();

        // Computed Properties
        this.customerUpkeep = ko.computed(function () {
            return this.customers().length * 100;
        }, this, { deferEvaluation: true });
        this.totalDailyUpkeep = ko.computed(function () {
            return this.customerUpkeep() + this.resort.totalUpkeep();
        }, this, { deferEvaluation: true });

        this.availableContracts = ko.observableArray([]);
        this.worldInfo = null;
        this.resort = null;
    }
    Game.prototype.initialize = function () {
        // Initialize the world, resort, and contracts.  Contracts must be done after the world.
        this.worldInfo = new WorldInfo();
        this.resort = new Resort();
        this.availableContracts(Contracts.createNewContracts(this.settings.contractLimit));
    };

    Game.prototype.getMinutesFromTicks = function (ticks) {
        var minutesPerTick = 24 * 60 / this.settings.daySettings.totalTicksPerDay;
        return minutesPerTick * ticks;
    };
    Game.prototype.getTimeSpanFromTicks = function (ticks) {
        var totalMinutes = this.getMinutesFromTicks(ticks);
        var hours = (parseInt(totalMinutes / 60) + this.settings.daySettings.wakeHour) % 24;
        var minutes = totalMinutes % 60;

        return {
            hours: hours,
            minutes: minutes
        };
    };
    Game.prototype.getFormattedTimeFromTicks = function (ticks) {
        var timeSpan = this.getTimeSpanFromTicks(ticks);

        var hours = timeSpan.hours;
        var minutes = timeSpan.minutes;
        var amPm = "AM";

        if (hours >= 12) {
            amPm = "PM";
            if (hours >= 13)
                hours -= 12;
        }

        if (hours == 0) {
            hours = 12;
        }

        if (minutes < 10)
            minutes = "0" + minutes;

        return hours.toFixed(0) + ":" + minutes + " " + amPm;
    };
    Game.prototype.getFormattedTimestamp = function (ticks) {
        var totalMinutes = this.getMinutesFromTicks(ticks)
        var hours = parseInt(totalMinutes / 60);
        var minutes = parseInt(totalMinutes % 60);
        
        if (minutes < 10)
            minutes = "0" + minutes.toString();

        return hours + ":" + minutes;
    };
    Game.prototype.getCurrentTimeFormatted = function () {
        return this.getFormattedTimeFromTicks(this.currentTick());
    };
    Game.prototype.tick = function () {
        if (this.currentTick() >= this.settings.daySettings.activeTicksPerDay) {
            while (this.currentTick() < this.settings.daySettings.totalTicksPerDay)
                this._tickInteral(false);

            this.currentTick(0);
            this._tickDay();
        } else {
            this._tickInteral(true);
        }
    };
    Game.prototype._tickDay = function () {
        this.currentDay(this.currentDay() + 1);
        this.availableContracts(Contracts.createNewContracts(this.settings.contractLimit));
    };
    Game.prototype._tickInteral = function (isActiveTick) {
        this.currentTick(this.currentTick() + 1);
        for (var i = 0; i < this.customers().length; i++)
            this.customers()[i].tick(isActiveTick);

        // Deduct daily expenses for each active tick
        if(isActiveTick)
            this.money(this.money() - this.totalDailyUpkeep() / this.settings.daySettings.activeTicksPerDay);
    };

    return new Game();
})();


//////////////
// Customer //
//////////////
function Customer() {
    this.firstName = CustomerNameGenerator.pickFirstName();
    this.lastName = CustomerNameGenerator.pickLastName();
    this.name = this.firstName + " " + this.lastName;

    // Tank Size
    this.baseTankSize = ko.observable(100);
    this.expandedTankSize = ko.observable(0);

    // Fill Rate
    this.baseFillRate = ko.observable(0);
    this.expandedFillRate = ko.observable(0);
    this.maxExpandedFillRate = ko.observable(20000);

    // Potential
    this.basePotential = ko.observable(1);
    this.expandedPotential = ko.observable(0);
    this.maxExpandedPotential = ko.observable(4);

    // Tolerance
    this.tolerance = ko.observable(100);
    this.maxTolerance = ko.observable(100);

    // Stretch Limit
    this.baseTankStretch = ko.observable(1.1);
    this.expandedTankStretch = ko.observable(0);
    this.maxExpandedTankStretch = ko.observable(0);

    // Happiness
    this.happiness = ko.observable(20);
    this.maxHappiness = ko.observable(100);

    // Measurements
    this.measurements = {};
    this.measurements.band = ko.observable(Random.nextInt(30, 32));
    this.measurements.hips = ko.observable(Random.nextInt(30, 33));
    this.measurements.waist = ko.observable(this.measurements.hips() - Random.nextInt(0, 3));

    // Tick Message
    this.currentTickMessage = ko.observable(null);

    // KO Computeds
    this.potential = ko.computed(function () {
        return this.basePotential() + this.expandedPotential();
    }, this);
    this.maxExpandedTankSize = ko.computed(function () {
        var value = this.potential() / 100 * this.baseTankSize();

        // If potential bonus is less than 50, average it with 50 to pull it closer to
        // a reasonable minimum that still has some reasonable scaling between low and 
        // high end values without ever penalizing the player. Add more 50s to flatten 
        // out the curve, add more potentialBonus to make a steeper curve.
        if (value < 50)
            value = Math.avg(50, 50, value);

        return value;
    }, this);
    this.tankStretch = ko.computed(function () {
        return this.baseTankStretch() + this.expandedTankStretch();
    }, this);
    this.tankSize = ko.computed(function () {
        return this.baseTankSize() + this.expandedTankSize();
    }, this);
    this.tankMax = ko.computed(function () {
        return this.tankSize() * this.tankStretch();
    }, this);
    this.maxFillRate = ko.computed(function () {
        // Clamp value between current base + expanded and 1/4 of a day.
        return Math.min(this.baseFillRate() + this.maxExpandedFillRate(), this.tankSize() / Game.settings.daySettings.totalTicksPerDay * 3);
    }, this);
    this.fillRate = ko.computed(function () {
        return Math.clamp(this.baseFillRate() + this.expandedFillRate(), 0, this.maxFillRate());
    }, this)

    // Misc.
    this.tankAmount = ko.observable(0);
    this.activeDrugs = ko.observableArray();
    this.amenitiyPreferences = ko.observable(new AmenitiesValue()._createRandomValue(2));
    this.activeMilker = ko.observable(null);
    this.contract = ko.observable();
}
(function () {
    Customer.prototype.messages = {
        Amenities: {
            relaxLow: ["I wish there was a place to relax around here.", "Sigh... there's nowhere to relax."],
            relaxHigh: ["At least a girl can relax around here!"],

            athleticLow: ["Isn't there some place around here I can burn some energy?", "Can't get a good workout here!"],
            athleticHigh: ["Feel the burn!"],

            pamperLow: ["I'm on a beach resort vacation!  Where's the service?", "Subpar service here. Hmph!"],
            pamperHigh: ["Fantastic resort here, darling!"]
        }
    };

    Customer.prototype.modHappiness = function (mod) {
        // Clamp happines
        this.happiness(Math.clamp(this.happiness() + mod, 0, this.maxHappiness()));
    };
    Customer.prototype.modExpandedFillRate = function (mod) {
        this.expandedFillRate(Math.clamp(this.expandedFillRate() + mod, 0, this.maxExpandedFillRate()));
    };
    Customer.prototype.modExpandedTankSize = function (mod) {
        this.expandedTankSize(Math.clamp(this.expandedTankSize() + mod, 0, this.maxExpandedTankSize()));
    };
    Customer.prototype.updateMessage = function (messageInfo) {
        /// <param name="messageInfo" type="MessageInfo" />
        if (!this.currentTickMessage() || this.currentTickMessage().priority < messageInfo.priority)
            this.currentTickMessage(messageInfo);
    };

    Customer.prototype.getBraSize = function () {
        var modifiedTankSize = Math.max(1, this.tankSize() - 80);
        var sizeTable = ["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        var cupInches = Math.round(Math.sqrt(modifiedTankSize) / 2.54);

        if (cupInches >= sizeTable.length)
            return (this.measurements.band() + cupInches) + "\"";

        return this.measurements.band() + sizeTable[cupInches];
    };

    Customer.prototype.attachMilker = function () {
        this.activeMilker(new Milker());
    };
    Customer.prototype.detachMilker = function () {
        this.activeMilker(null);
    };
    Customer.prototype.getDrugByName = function (drugName) {
        var drug = $.grep(this.activeDrugs(), function (item) {
            return item.name == drugName;
        });

        if (drug.length == 0)
            return null;

        return drug[0];
    };
    Customer.prototype.tick = function (isActiveTick) {
        this.currentTickMessage(null);

        this._tickTankFillStart();
        this._tickMilker();
        this._tickTankSizeGain();
        this._tickDrugs();
        this._tickTankFillEnd();
        this._tickFillRateGain();

        if (isActiveTick)
            this._tickAmenities();

        this.contract().tick();
    };
    Customer.prototype._tickFillRateGain = function () {
        if (this.tankAmount() <= this.tankSize()) {
            var tankEmptyMultiplier = (this.tankSize() - this.tankAmount()) / this.tankSize();
            var fillRateDifferenceMultiplier = 1 - (this.fillRate() / this.maxFillRate());
            var overallMultiplier = tankEmptyMultiplier * fillRateDifferenceMultiplier;

            this.modExpandedFillRate(overallMultiplier * this.fillRate() * this.tankSize() * 0.0001);
        } else {
            var percentOver = this.tankAmount() / this.tankSize() - 1;
            var overLimitPenalty = this.fillRate() * 0.2 * percentOver;

            this.modExpandedFillRate(-overLimitPenalty);
        }
    };
    Customer.prototype._tickTankSizeGain = function () {
        if (this.tankAmount() < this.tankSize())
            return;

        var overlimitAmount = this.tankAmount() - this.tankSize();
        this.modExpandedTankSize(overlimitAmount * 0.02);
    };
    Customer.prototype._tickTankFillEnd = function () {
        var totalHappinessChange = 0;
        if (this.tankAmount() > this.tankMax()) {
            // Lose 1 point of happiness for each 1% above tankMax
            var overLimitAmount = this.tankAmount() - this.tankMax();
            totalHappinessChange -= (overLimitAmount / this.tankMax()) * 100

            // Reset to tankAmount to tankMax
            this.tankAmount(this.tankMax());
        }

        if (this.tankAmount() > this.tankSize()) {
            // Lose 1 point of happiness for each 2.5% above tankSize
            var overLimitAmount = this.tankAmount() - this.tankSize();
            totalHappinessChange -= (overLimitAmount / this.tankSize()) * 40;
        }

        this.modHappiness(totalHappinessChange);
    };
    Customer.prototype._tickDrugs = function () {
        if (this.tolerance() < this.maxTolerance()) {
            var toleranceRecovered = this.maxTolerance() * (1 / Game.settings.daySettings.totalTicksPerDay);
            this.tolerance(Math.min(this.maxTolerance(), this.tolerance() + toleranceRecovered));
        }

        var drugs = this.activeDrugs();
        if (!drugs) // no effects, get out
            return;

        for (var i = drugs.length - 1; i > -1; i--) {
            var drug = drugs[i];
            drug.tickEffect(this);
            drug.decay();

            if (drug.durationTicks() < 1)
                this.activeDrugs.splice(i, 1);
        }
    };
    Customer.prototype._tickTankFillStart = function () {
        this.tankAmount(this.tankAmount() + this.fillRate());
    };
    Customer.prototype._tickMilker = function () {
        if (this.activeMilker())
            this.activeMilker().milk(this);
    };
    Customer.prototype._tickAmenities = function () {
        // Customers have 1 point of happiness at stake per point of 
        // amenity preference.  They have the potential to gain 1/3
        // of their happiness at stake instead if the resort exceeds
        // their demands.
        var happinessBonusFraction = 3;
        var unhappyMessagePriority = 5;
        var happyMessagePriority = 1;

        // If milker is attached, all amenity values are zero
        var activeScoringSource = null;
        if (this.activeMilker() == null)
            activeScoringSource = Game.resort.totalAmenitiesValue();
        else
            activeScoringSource = new AmenitiesValue();

        var scoreDifferences = activeScoringSource.subtract(this.amenitiyPreferences());
        var happinessChange = 0;
        var preferencePointTotal = 0;

        var highestPriorityMessage = {
            weight: 0,
            messageText: null
        };

        // For each type of amentity preference...
        for (var i = 0 ; i < scoreDifferences.valueNames.length; i++) {
            var propName = scoreDifferences.valueNames[i];
            var diffValue = scoreDifferences[propName];

            preferencePointTotal += this.amenitiyPreferences()[propName];
            var messageText = this._getAmentityMessage(propName, diffValue);

            if (diffValue < 0) {
                if (diffValue < highestPriorityMessage.weight) {
                    highestPriorityMessage.weight = diffValue;
                    highestPriorityMessage.messageText = messageText;
                }

                // Subtract one point of happiness for every point below desired value
                happinessChange += diffValue;
            }
            else if (diffValue > 0) {
                if (highestPriorityMessage.weight >= 0 && diffValue > highestPriorityMessage.weight) {
                    highestPriorityMessage.weight = diffValue;
                    highestPriorityMessage.messageText = messageText;
                }

                // Add 1/3 of the exceeded value as a happiness gain
                happinessChange += diffValue / happinessBonusFraction;
            }
        }

        // Cap happiness bonus at 1/3 total points at stake
        if (happinessChange > 0 && happinessChange > preferencePointTotal / happinessBonusFraction)
            happinessChange = preferencePointTotal / happinessBonusFraction;

        // Apply happiness change
        this.modHappiness(happinessChange);

        // No amenities related messages, bug out
        if (!highestPriorityMessage.messageText)
            return;

        // Get the correct message priority - unhappy messages are always more important
        var messagePriority = highestPriorityMessage.weight < 0 ? unhappyMessagePriority : happyMessagePriority;
        this.updateMessage(new MessageInfo(highestPriorityMessage.messageText, MessageTypes.Amenity, messagePriority));
    };
    Customer.prototype._getAmentityMessage = function (amentityName, diffValue) {
        // Verify prop name exists
        var messagePropName = amentityName + (diffValue >= 0 ? "High" : "Low");
        if (!this.messages.Amenities[messagePropName])
            return null;

        return this.messages.Amenities[messagePropName].random();
    };
})();


////////////////////////////
// World Info & Contracts //
////////////////////////////
function WorldInfo() {
    this.generation = ko.observable();
    this.existingCustomerPopulation = ko.observableArray();
    this.newCustomerPopulation = ko.observableArray();
    this.population = ko.observableArray();
    this.sampleSize = 10000;

    // Population Generation Levers
    this.initialTankSizeVariance = 0.15;
    this.initialTankSizeVariancePotentialInfluenceScale = 100;
    this.initialBasePotential = 1.5;
    this.initialMaxPotential = 5;
    this.potentialVariance = 0.5;

    this.initialTankSizeTable = new WeightedRandomItemPicker([
        new WeightedRandomItem(90, 1),
        new WeightedRandomItem(100, 6),
        new WeightedRandomItem(140, 2),
        new WeightedRandomItem(180, 1),
    ]);

    var self = this;
    Debug.TimeFunction(function () {
        self.createInitialPopulation();
    });
}
(function () {
    WorldInfo.prototype.recruitCustomer = function (customer) {
        var popIndex = 0;
        for (; popIndex < this.population().length; popIndex++) {
            if (this.population()[popIndex] == customer)
                break;
        }

        this.population.splice(popIndex, 1);
        this.existingCustomerPopulation.push(customer);
    };
    WorldInfo.prototype.createInitialPopulation = function () {
        // Create the population
        var popArray = [];
        for (var i = 0; i < this.sampleSize; i++) {
            var customer = new Customer();

            var potentialBonus = this.initialBasePotential * Random.nextFloat(0, this.potentialVariance);
            customer.basePotential(this.initialBasePotential + potentialBonus);
            customer.maxExpandedPotential(this.initialMaxPotential * Random.nextFloat(0, this.potentialVariance));

            var variancePotentialBonus = customer.potential() / this.initialTankSizeVariancePotentialInfluenceScale;
            var tankSize = this.initialTankSizeTable.random().value;
            var tankBonus = Random.nextFloat(-this.initialTankSizeVariance + variancePotentialBonus, this.initialTankSizeVariance + variancePotentialBonus) * tankSize;
            customer.baseTankSize(tankSize + tankBonus);

            popArray.push(customer);
        }

        // Empty arrays and replace their underlying observable value with a shallow copy
        this.population.splice(0);
        this.population(popArray.slice(0));

        this.newCustomerPopulation.splice(0);
        this.newCustomerPopulation(popArray.slice(0));
    };

    // ------------------------------
    // Simple Data Analysis functions
    // ------------------------------
    // These exist only to provide us with the ability to discover what changes to 
    // world and population generation have done.  They should never be called
    // during normal gameplay.
    WorldInfo.prototype._calculateAverageTankSize = function () {
        var sum = 0;
        for (var i = 0; i < this.population().length; i++)
            sum += this.population()[i].tankSize();
        return sum / this.population().length;
    };
    WorldInfo.prototype._getSizeSpread = function () {
        return ArrayHelpers.createDictionaryArray(this.population(), function (item) {
            return item.getBraSize();
        });
    };
})();

var Contracts = (function () {
    function CustomerContractBase(customer) {
        /// <param name="customer" type="Customer" />
        this.upfrontPay = 0;
        this.customer = customer;
        this.isComplete = false;
        this.isAccepted = false;
    }
    (function () {
        CustomerContractBase.prototype.typeName = "BaseContract";
        CustomerContractBase.prototype.happinessBreakEvenPoint = 20;
        CustomerContractBase.prototype._calculateHappinessBonusRate = function () {
            var value = this.customer.happiness() - this.happinessBreakEvenPoint;
            if (value == 0)
                return 1;

            if (value < 0) {
                // Scale from 1.0 to 0.5
                return -value / (this.happinessBreakEvenPoint * 2);
            }

            // Scale from 1 to 1.5
            return 1 + (value / (2 * (100 - this.happinessBreakEvenPoint)));
        };
        CustomerContractBase.prototype._acceptContractInternal = function () {
            if (this.isAccepted)
                return;

            this.isAccepted = true;
            this.customer.contract(this);
            Game.availableContracts.remove(this);
            Game.worldInfo.recruitCustomer(this.customer);
            Game.customers.push(this.customer);
            Game.messageLog.createAdd(this.customer.name + " joined the resort.");
        };
        CustomerContractBase.prototype.acceptContract = function () {
            if (this.isAccepted)
                return;

            this._acceptContractInternal();
        };
        CustomerContractBase.prototype.completeContract = function () {
            // Pay out
            var contractPay = this.calculatePayoff() * this._calculateHappinessBonusRate();
            Game.money(Game.money() + contractPay);

            // Remove customer
            for (var i = 0; i < Game.customers().length; i++) {
                if (Game.customers()[i] != this.customer)
                    continue;
             
                Game.customers.splice(i, 1);
                break;
            }

            Game.messageLog.createAdd(this.customer.name + " left the resort.  Earned $" + contractPay.toFixed(2));
        };
        CustomerContractBase.prototype.tick = function () {

        };
        CustomerContractBase.prototype.tickNextDay = function () {

        };
        CustomerContractBase.prototype.calculatePayoff = function () {
            return 0;
        };
    })();

    function DayLimitContract(customer, dayCount) {
        /// <param name="customer" type="Customer" />
        CustomerContractBase.call(this, customer);

        if (!dayCount) {
            dayCount = this.dayCountWeights.random().value;
        }

        this.dayCount = dayCount;
        this.ticksRemaining = ko.observable(0);
    }
    (function () {
        $.extend(DayLimitContract.prototype, CustomerContractBase.prototype);
        DayLimitContract.prototype.typeName = "Day Limit";
        DayLimitContract.prototype.moneyPerMillimeterGrowth = 18;
        DayLimitContract.prototype.moneyPerMillimeterGrowthCompoundSize = 10;
        DayLimitContract.prototype.moneyPerMillimeterGrowthCompoundRate = 0.33;
        DayLimitContract.prototype.dayCountWeights = new WeightedRandomItemPicker([
            new WeightedRandomItem(3, 6),
            new WeightedRandomItem(5, 2),
            new WeightedRandomItem(7, 1)
        ]);

        DayLimitContract.prototype.tick = function () {
            this.ticksRemaining(this.ticksRemaining() - 1);
            if (this.ticksRemaining() == 0) {
                this.completeContract();
            }
        };
        DayLimitContract.prototype.acceptContract = function () {
            if (this.isAccepted)
                return;

            this.ticksRemaining(this.dayCount * Game.settings.daySettings.totalTicksPerDay);
            this._acceptContractInternal();
        };
        DayLimitContract.prototype._calculatePayoff = function (expandedTankSize) {
            var compoundBonus = 1;
            if (expandedTankSize > this.moneyPerMillimeterGrowthCompoundSize) {
                compoundBonus = (1 + this.moneyPerMillimeterGrowthCompoundRate) ^ (expandedTankSize / this.moneyPerMillimeterGrowthCompoundSize);
            }
            return compoundBonus * this.moneyPerMillimeterGrowth * expandedTankSize;
        };
        DayLimitContract.prototype.calculateExpectedPayoff = function () {
            return this._calculatePayoff(this.customer.maxExpandedTankSize() * 0.8);
        };
        DayLimitContract.prototype.calculatePayoff = function () {
            return this._calculatePayoff(this.customer.expandedTankSize());
        };
    })();

    function SizeLimitContract(customer, desiredSizeIncrease) {
        /// <param name="customer" type="Customer" />
        CustomerContractBase.call(this, customer);

        if (!desiredSizeIncrease) {
            desiredSizeIncrease = Random.nextFloat(0.75, 0.95) * customer.maxExpandedTankSize();
        }

        this.desiredSizeIncrease = desiredSizeIncrease;
        this.totalTargetSize = this.customer.tankSize() + desiredSizeIncrease;
    }
    (function () {
        $.extend(SizeLimitContract.prototype, CustomerContractBase.prototype);
        SizeLimitContract.prototype.typeName = "Size Limit";
        SizeLimitContract.prototype.moneyPerMillimeterGrowth = 13;
        SizeLimitContract.prototype.moneyPerMillimeterGrowthCompoundSize = 10;
        SizeLimitContract.prototype.moneyPerMillimeterGrowthCompoundRate = 0.2;

        SizeLimitContract.prototype.tick = function () {
            if (this.customer.tankSize() >= this.totalTargetSize)
                this.completeContract();
        };
        SizeLimitContract.prototype._calculatePayoff = function (expandedTankSize) {
            var compoundBonus = 1;
            if (expandedTankSize > this.moneyPerMillimeterGrowthCompoundSize) {
                compoundBonus = (1 + this.moneyPerMillimeterGrowthCompoundRate) ^ (expandedTankSize / this.moneyPerMillimeterGrowthCompoundSize);
            }
            return compoundBonus * this.moneyPerMillimeterGrowth * expandedTankSize;
        };
        SizeLimitContract.prototype.calculateExpectedPayoff = function () {
            return this._calculatePayoff(this.desiredSizeIncrease);
        };
        SizeLimitContract.prototype.calculatePayoff = function () {
            return this._calculatePayoff(this.customer.expandedTankSize());
        };
    })();

    var contractWeights = new WeightedRandomItemPicker([
        new WeightedRandomItem(SizeLimitContract, 4),
        new WeightedRandomItem(DayLimitContract, 1)
    ]);

    function createNewContracts(contractCount) {
        var pop = Game.worldInfo.newCustomerPopulation();
        if (contractCount > pop.length)
            throw "More contracts requested than people available.  Did we REALLY run out of customers?";

        var contracts = [];
        var selectedCustomerIndexes = [];
        while (contracts.length < contractCount) {
            // Get a customer index, verify it hasn't been selected already.
            var index = Random.nextInt(0, pop.length - 1);
            if (selectedCustomerIndexes.length > 0 && selectedCustomerIndexes.some(function (i) { return i == index; }))
                continue;

            // Add the customer index to the selected array, get the customer
            selectedCustomerIndexes.push(index);
            var customer = pop[index];

            // Get the contract type function, create the contract with the customer
            var contractType = contractWeights.random().value;
            contracts.push(new contractType(customer))
        }

        contracts = contracts.sort(function (a, b) {
            // Sort by type name
            return ArrayHelpers.compareProperties(a, b, ["typeName", "desiredSizeIncrease", "dayCount"]);
        });

        return contracts;
    }

    return {
        // "Namespace" members
        contractWeights: contractWeights,
        createNewContracts: createNewContracts,

        // Contract Types
        CustomerContractBase: CustomerContractBase,
        DayLimitContract: DayLimitContract,
        SizeLimitContract: SizeLimitContract
    };
})();


////////////////////
// Milker & Drugs //
////////////////////
function Milker() {
    this.minMilkRate = ko.observable(1);
    this.maxMilkRate = ko.observable(100);
    this.milkRate = ko.observable(1);
    this.chemRate = ko.observable(0.025);
}
(function () {
    Milker.prototype.modMilkRate = function (mod) {
        this.milkRate(Math.clamp(this.milkRate() + mod, this.minMilkRate(), this.maxMilkRate()));
    };
    Milker.prototype.setMilkRate = function (value) {
        this.milkRate(Math.clamp(value, this.minMilkRate(), this.maxMilkRate()));
    };
    Milker.prototype.milk = function (customer) {
        var milkDrained = this.milkRate() <= customer.tankAmount() ? this.milkRate() : customer.tankAmount();
        customer.tankAmount(customer.tankAmount() - milkDrained);
        customer.modHappiness(milkDrained / 100);

        Game.chem(Game.chem() + this.chemRate() * milkDrained);
    };
})();

var Drugs = (function () {

    function DrugBase() {
        this.name = "N/A";
        this.costMoney = ko.observable(0);
        this.costChem = ko.observable(0);
        this.costTolerance = ko.observable(0);
        this.ticksPerDose = ko.observable(0);
        this.description = "N/A";

        this.durationTicks = ko.observable(0);
        this.maxDurationTicks = ko.observable(0);
    }
    DrugBase.prototype.calculatePower = function () {
        return this.durationTicks() / this.ticksPerDose();
    };
    DrugBase.prototype.decay = function () {
        this.durationTicks(this.durationTicks() - 1);
    };
    DrugBase.prototype.tickEffect = function () {
        throw "Chemical tick not implemented."
    };
    DrugBase.prototype.modDurationTicks = function (mod) {
        this.durationTicks(Math.min(this.durationTicks() + mod, this.maxDurationTicks()));
    };

    function Expandofirm() {
        this._base.call(this);

        this.name = "Expandofirm";
        this.costMoney(50);
        this.costChem(0);
        this.costTolerance(40);
        this.ticksPerDose(Game.settings.daySettings.totalTicksPerDay * 1.5);
        this.maxDurationTicks(Game.settings.daySettings.totalTicksPerDay * 2);
        this.description = "Provides 8-10ml breast expansion and 2ml milk rate per day.";

        this.tankGrowthPerDay = 10;
        this.fillRateGrowthPerDay = 2;

        this.durationTicks(this.ticksPerDose());
    }
    Expandofirm.prototype._base = DrugBase;
    $.extend(Expandofirm.prototype, DrugBase.prototype);
    Expandofirm.prototype.tickEffect = function (customer) {
        /// <param name="customer" type="Customer"></param>
        var effectivePower = this.calculatePower();
        customer.modExpandedTankSize(effectivePower * this.tankGrowthPerDay / Game.settings.daySettings.totalTicksPerDay * Random.nextFloat(0.8, 1));
        customer.modExpandedFillRate(effectivePower * this.fillRateGrowthPerDay / Game.settings.daySettings.totalTicksPerDay * Random.nextFloat(0.8, 1));
    };

    function TestDrug() {
        this._base.call(this);

        this.name = "Test Drug";
        this.costMoney(0);
        this.costChem(0);
        this.costTolerance(40);
        this.ticksPerDose(Game.settings.daySettings.totalTicksPerDay * 10);
        this.maxDurationTicks(Game.settings.daySettings.totalTicksPerDay * 20);
        this.description = "Provides a ton of breast expansion and lactation for testing limits.";

        this.tankGrowthPerDay = 500;
        this.fillRateGrowthPerDay = 100;

        this.durationTicks(this.ticksPerDose());
    }
    TestDrug.prototype._base = DrugBase;
    $.extend(TestDrug.prototype, DrugBase.prototype);
    TestDrug.prototype.tickEffect = function (customer) {
        /// <param name="customer" type="Customer" />
        var effectivePower = this.calculatePower();
        customer.modExpandedTankSize(effectivePower * this.tankGrowthPerDay / Game.settings.daySettings.totalTicksPerDay * Random.nextFloat(0.8, 1));
        customer.modExpandedFillRate(effectivePower * this.fillRateGrowthPerDay / Game.settings.daySettings.totalTicksPerDay * Random.nextFloat(0.8, 1));
    };

    var drugList = [];
    function _initializeDrugList() {
        drugList.push({
            effect: new Expandofirm(),
            function: Expandofirm
        });
        drugList.push({
            effect: new TestDrug(),
            function: TestDrug
        });
    }

    function buyDrug(customer, drugFunction) {
        /// <param name="customer" type="Customer"></param>
        /// <param name="drug" type="DrugBase"></param>

        var drug = new drugFunction();

        customer.tolerance(customer.tolerance() - drug.costTolerance());
        Game.money(Game.money() - drug.costMoney());
        Game.chem(Game.chem() - drug.costChem());

        var existingDrug = customer.getDrugByName(drug.name);
        if (existingDrug) {
            existingDrug.modDurationTicks(drug.ticksPerDose());
        } else {
            customer.activeDrugs.push(drug);
        }
    }

    return {
        buyDrug: buyDrug,
        Expandofirm: Expandofirm,
        drugList: drugList,
        _initializeDrugList: _initializeDrugList
    };
})();



/////////////////////////////////
//// Customer Name Generator ////
/////////////////////////////////
var CustomerNameGenerator = new (function NameGenerator() {
    this.firstNames = [
        "FirstName1",
        "FirstName2",
        "FirstName3",
        "FirstName4",
        "FirstName5",
    ];

    this.lastNames = [
        "LastName1",
        "LastName2",
        "LastName3",
        "LastName4",
        "LastName5",
    ];

    this.pickFirstName = function () {
        return this.firstNames.random();
    };

    this.pickLastName = function () {
        return this.lastNames.random();
    };
})();