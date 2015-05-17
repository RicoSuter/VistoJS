define(["require", "exports"], function (require, exports) {
    function getItems(completed) {
        setTimeout(function () {
            completed([
                { id: 1, title: "Item 1" },
                { id: 2, title: "Item 2" },
                { id: 3, title: "Item 3" }
            ]);
        }, 1000);
    }
    exports.getItems = getItems;
});
//# sourceMappingURL=SampleService.js.map