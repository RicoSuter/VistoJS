define(["require", "exports"], function (require, exports) {
    "use strict";
    function isFormValid(view, formElement) {
        return isFormValidInternal(formElement, view.viewChildren);
    }
    exports.isFormValid = isFormValid;
    function isFormValidComputable(view, formElement) {
        return ko.computed(function () {
            var isViewLoaded = view.isViewLoaded();
            var isFormValid = isFormValidInternal(formElement, view.viewChildren);
            return isViewLoaded && isFormValid;
        });
    }
    exports.isFormValidComputable = isFormValidComputable;
    function isFormValidInternal(formElement, children) {
        var isFormValid = true;
        for (var _i = 0, _a = getInputViewModelsWithValidation(formElement, children); _i < _a.length; _i++) {
            var viewModel = _a[_i];
            var isValid = viewModel.isValid();
            if (!isValid)
                isFormValid = false;
        }
        return isFormValid;
    }
    function getInputViewModelsWithValidation(formElement, children) {
        var inputViewModels = [];
        for (var _i = 0, _a = children(); _i < _a.length; _i++) {
            var viewChild = _a[_i];
            var viewElement = viewChild.element;
            var viewModel = viewChild.viewModel;
            if (formElement.find(viewElement).length > 0) {
                if (viewModel !== undefined && viewModel !== null && viewModel.isValid !== undefined)
                    inputViewModels.push(viewModel);
            }
        }
        return inputViewModels;
    }
});
//# sourceMappingURL=validation.js.map