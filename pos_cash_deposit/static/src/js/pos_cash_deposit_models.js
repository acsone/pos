function pos_cash_deposit_models(instance, module) { //module is instance.point_of_sale
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;

    var _super_initialize = module.Orderline.prototype.initialize;
    var _super_export_as_JSON = module.Orderline.prototype.export_as_JSON;
    var _super_addProduct = module.Order.prototype.addProduct;

    module.Orderline.prototype.export_as_JSON = function () {
        res = _super_export_as_JSON.call(this);
        res.notice = this.notice;
        return res;
    };

    module.Orderline.prototype.initialize = function (attr, options) {
        this.notice = options.notice;
        _super_initialize.call(this, attr, options);
    };

    module.Order.prototype.addProduct = function (product, options) {
        var parent = this
        var orderLines = this.attributes.orderLines.models;
        var trouve = false;
        for (var index in orderLines) {
            if (orderLines.hasOwnProperty(index)) {
                if (orderLines[index].product.id == this.pos.db.cash_deposit_id) {
                    self.pos_widget.screen_selector.show_popup('error', {
                        message: _t('Please remove cash deposit product of your ' +
                            'shopping cart to process to add some products')
                    });
                    trouve = true;
                    continue;
                }
            }
        }
        if (!trouve) {
            _super_addProduct.call(parent, product, options);
        }
    }
}