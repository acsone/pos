function pos_cash_deposit_widgets(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;

    module.PosWidget = module.PosWidget.extend({
        build_widgets: function () {
            this._super();
            this.cash_deposit_popup = new module.CashDepositPopupWidget(this, {});
            this.cash_deposit_popup.appendTo(this.$el);
            this.cash_deposit_popup.hide();
        },
    });

    module.ProductCategoriesWidget.include({

        init: function (parent, options) {
            this._super(parent, options);
        },

        renderElement: function () {
            var self = this;
            this._super();
            $('#cash_deposit').click(function () {
                var currentOrder = self.pos.get('selectedOrder');
                var cid = currentOrder.get_client() ? currentOrder.get_client().id : 0;
                if (cid != null && cid != 0) {
                    self.pos_widget.screen_selector.current_popup = self.pos_widget.cash_deposit_popup;
                    self.pos_widget.screen_selector.current_popup.show();
                } else {
                    self.pos_widget.screen_selector.show_popup('error', {
                        message: _t('You must select a customer in the order tab first !'),
                    });
                }
            });
        }
    });

    module.CashDepositPopupWidget = module.PopUpWidget.extend({
        template: 'CashDepositPopupWidget',
        show: function () {
            this._super();
            this.renderElement();
            var self = this;
            self.pos_widget.order_widget.disable_numpad()
            this.$('.apply-button').off('click').click(function () {
                var amount = $("#amount_deposit", this.$el).val();
                amount = amount.replace(',', '.');
                amount = parseFloat(amount);
                if (isNaN(amount)) {
                    alert('Please Enter A Correct Amount Number');
                } else {
                    var message = $("#message_deposit", this.$el).val();
                    self.pos_widget.screen_selector.close_popup();
                    self.create_cash_deposit(message, amount);
                }
            });
            this.$('.close-button').off('click').click(function () {
                self.pos_widget.screen_selector.close_popup();
            });
        },

        hide: function () {
            this._super();
            var self = this;
            self.pos_widget.order_widget.enable_numpad()
        },

        create_cash_deposit: function (message, amount) {
            var self = this;
            product = jQuery.extend({}, self.pos.db.cash_deposit_product)
            product.price = amount;
            product.display_name = _t(product.name) + ' : ' + message;
            order = self.pos.get('selectedOrder');
            var line = new module.Orderline({}, {
                pos: order.pos,
                order: order,
                product: product,
                notice: message
            });
            var orderLines = order.get('orderLines').models;
            order.get('orderLines').add(line);
            order.selectLine(order.getLastOrderline());
        }
    });
}
