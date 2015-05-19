import visto = require("libs/visto");
import svc = require("SampleService")

export class DetailsPageModel extends visto.ViewModel {
    item = ko.observable<svc.ISampleItem>();

    initialize(parameters: visto.Parameters) {
        if (!this.parameters.isPageRestore()) {
            this.item(parameters.getObject<svc.ISampleItem>("item", null));
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