import visto = require("libs/visto");
import vm = require("../viewModels/TabControlModel");

export class TabControl extends visto.View<vm.TabControlModel> {
    initialize() {
        this.viewModel.tabsChanged = () => { this.onTabsChanged(); };
    }

    onTabsChanged() {
        var tabs = this.viewModel.tabs();
        for (var i = 0, item: vm.ITab; (item = tabs[i]) != undefined; i++) { // set view package
            if (item.view !== undefined && item.view.indexOf(":") === -1)
                item.view = this.parentView.viewPackage + ":" + item.view;
        }
    }
} 