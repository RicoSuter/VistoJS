import visto = require("libs/visto");
import common = require("common/main");
import svc = require("SampleService");
import package = require("module");

export class ListPageModel extends visto.VistoViewModel {
	items = ko.observableArray<svc.ISampleItem>();
    isLoading = ko.observable(false);

    initialize() {
        this.enablePageRestore();
    }
    
	onLoaded() {
		this.isLoading(true);
		svc.getItems(items => {
			this.items(items);
			this.isLoading(false);
		});
	}

	showItem(item: svc.ISampleItem) {
        visto.navigateTo(package, "DetailsPage", { item: item });
    }
    
	addItem() {
		common.prompt("Add Item", "Please enter the item name: ", "", title => {
			if (title !== "")
				this.items.push({ id: 1, title: title }); 
		});
	}

	deleteItem(item: svc.ISampleItem) {
		this.items.remove(item);
	}
};