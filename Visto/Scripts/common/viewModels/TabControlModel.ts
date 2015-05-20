import visto = require("libs/visto");

export interface ITab {
    title: string; 
    view: string; 
    click: () => void; 
}

export class TabControlModel extends visto.ViewModel {
    tabs: KnockoutObservableArray<ITab>;
	selectedTab = ko.observable<string>(null);
    showBackButton: boolean;
    tabsChanged: () => void;

    initialize() {
        this.tabs = this.parameters.getObservableArray<ITab>("tabs");
        this.showBackButton = this.parameters.getBoolean("showBackButton", true);

        this.tabsChanged();

        this.subscribe(this.tabs, this.tabsChanged);
        this.selectedTab(this.tabs()[0].view);
	}
    
    setTab(tab: ITab) {
		this.selectedTab(tab.view.toString());
	}
}