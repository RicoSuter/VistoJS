import visto = require("libs/visto");

export interface ITab {
    title: string; 
    view: string; 
}

export class TabControlModel extends visto.ViewModel {
    parentView: visto.ViewBase;
    tabs: KnockoutObservableArray<ITab>;
	selectedTab = ko.observable<string>(null);

    initialize() {
        this.tabs = this.parameters.getObservableArray<ITab>("tabs");
		this.tabsChanged();
		this.subscribe(this.tabs, this.tabsChanged);
		this.selectedTab((<any>this.tabs()[1]).view.toString());
	}

	tabsChanged() {
		var tabs = this.tabs(); 
        for (var i = 0, item: ITab; (item = tabs[i]) != undefined; i++) { // set view package
			if (item.view !== undefined && item.view.indexOf(":") === -1)
				item.view = this.parentView.viewPackage + ":" + item.view;
		}
	}

    setTab(tab: ITab) {
		this.selectedTab(tab.view.toString());
	}
}