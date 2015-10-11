/// <reference path="~/js/game.js" />

function GameView() {
    Game.initialize();
    Drugs._initializeDrugList();

    this.observable = ko.observable(this);
    this.game = Game;
    this.currentTabTemplate = ko.observable();
    this.setCurrentTab("customers-tab");
}

// Can Purchase Logic
GameView.prototype.canBuyDrug = function (customer, drug) {
    return drug.costMoney() <= this.game.money()
        && drug.costChem() <= this.game.chem()
        && drug.costTolerance() <= customer.tolerance();
};
GameView.prototype.canBuyUpgrade = function (upgrade) {
    return upgrade.price() <= this.game.money();
};


// Navigation
GameView.prototype.setCurrentTab = function (tabName) {
    var self = this;
    this.currentTabTemplate({
        name: tabName,
        data: this,
        afterRender: function () { self.postRefreshView(); }
    });
};
GameView.prototype.showCustomersTab = function () {
    this.setCurrentTab("customers-tab");
};
GameView.prototype.showContractsTab = function () {
    this.setCurrentTab("contracts-tab");
};
GameView.prototype.showUpgradesTab = function () {
    this.setCurrentTab("upgrades-tab");
};

// Top Level
GameView.prototype.tick = function () {
    if (this.game.currentTick() == this.game.settings.daySettings.activeTicksPerDay) {
        var result = confirm("Are you sure you want to end the day?");
        if (!result)
            return;
    }
        
    this.game.tick();
    this.refreshView();
};
GameView.prototype.refreshView = function () {
    
};
GameView.prototype.postRefreshView = function () {

};

GameView.prototype.expanderClick = function (i, e) {
    $(e.target).parents('.expander-title').siblings('.expander-content').toggle();
};