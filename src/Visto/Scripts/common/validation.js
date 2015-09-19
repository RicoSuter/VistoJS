define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    function isFormValid(formElement) {
        var children = getFormViewChildren(formElement);
        return isFormValidInternal(formElement, children);
    }
    exports.isFormValid = isFormValid;
    function isFormValidComputable(formElement) {
        var children = getFormViewChildren(formElement);
        return ko.computed(function () {
            return isFormValidInternal(formElement, children);
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
    function getFormViewChildren(formElement) {
        var parentView = visto.getViewFromElement(formElement);
        if (parentView !== undefined && parentView !== null)
            return parentView.viewChildren;
        return ko.observableArray();
    }
});
//# sourceMappingURL=validation.js.map