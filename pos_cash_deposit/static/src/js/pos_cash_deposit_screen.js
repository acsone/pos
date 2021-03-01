function pos_cash_deposit_screens(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;


    module.PaymentScreenWidget.include({
        validate_order: function (options) {
            options = options || {};
            var parent = this
            var order = this.pos.get('selectedOrder');
            var orderLines = order.get('orderLines').models;
            var trouve = false;
            for (var index in orderLines) {
                if (orderLines.hasOwnProperty(index)) {
                    if (orderLines[index].product.id == this.pos.db.cash_deposit_id) {
                        options['invoice'] = false;
                        continue;
                    }
                }
            }
            this._super(options);
        },
        is_cash_deposit: function(){
            var self = this;
            var currentOrder = self.pos.get('selectedOrder');
            var orderlines = currentOrder.get('orderLines');
            is_cash_deposit = false;
            for (i=0; i < orderlines.length && !is_cash_deposit; i++) {
                if (orderlines.models[i].product.id == self.pos.db.cash_deposit_id) {
                    is_cash_deposit = true;
                }
            }
            return is_cash_deposit
        },
        show: function () {
            this._super();
            this.pos_widget.action_bar.set_button_disabled('invoice', this.is_cash_deposit());
        },
        update_payment_summary: function () {
            this._super();
            var self = this
            if (this.pos_widget.action_bar) {
                self.pos_widget.action_bar.set_button_disabled('invoice', this.is_cash_deposit());
            }
        },
    });

}