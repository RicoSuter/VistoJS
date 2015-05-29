import visto = require("libs/visto");
import common = require("common/main");
import svc = require("SampleService");
import package = require("module");

export class ListPageModel extends visto.ViewModel {
    items = ko.observableArray<svc.ISampleItem>();
    isLoading = ko.observable(false);

    initialize() {
        this.enablePageRestore();
    }

    onLoaded() {
        this.isLoading(true);
        svc.getItems().then(items => {
            this.items(items);
            this.isLoading(false);
        }).done();
    }

    showItem(item: svc.ISampleItem) {
        visto.navigateTo(package, "DetailsPage", { item: item });
    }

    addItem() {
        common.prompt("Add Item", "Please enter the item name: ", "").then(title => {
            if (title !== null)
                this.items.push({
                    id: (Math.floor(Math.random() * 4294967296) + 1),
                    title: title
                });
        });
    }

    deleteItem(item: svc.ISampleItem) {
        this.items.remove(item);
    }
};