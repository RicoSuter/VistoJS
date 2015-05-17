import visto = require("libs/visto");
import svc = require("SampleService")

export class DetailsPageModel extends visto.VistoViewModel {
    item = ko.observable<svc.ISampleItem>();

    initialize(parameters: visto.VistoParameters) {
        if (!this.parameters.isPageRestore()) {
            this.item(parameters.getValue<svc.ISampleItem>("item", null));
            this.enablePageRestore(this.item().id.toString());
        }
    }

    onLoading(callback: () => void) {
        if (this.parameters.isPageRestore()) {
            var id = Number(this.parameters.getRestoreQuery());
            svc.getItems(items => {
                for (var i = 0, item: any; (item = items[i]) !== undefined; i++) {
                    if (item.id === id)
                        this.item(item);
                }
                callback();
            });
        } else
            callback();
    }
};