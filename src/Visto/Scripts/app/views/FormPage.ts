import visto = require("libs/visto");
import validation = require("common/validation");
import formPageModel = require("../viewModels/FormPageModel");

export class FormPage extends visto.Page<formPageModel.FormPageModel> {
    initialize() {
        var formElement = this.getViewElement("form");
        var isFormValid = validation.isFormValidComputable(this, formElement); 

        this.viewModel.isFormValid = isFormValid;
    }
} 