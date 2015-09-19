import visto = require("libs/visto");

export class FormPageModel extends visto.ViewModel {
    hasLastName = ko.observable<boolean>(true);
}