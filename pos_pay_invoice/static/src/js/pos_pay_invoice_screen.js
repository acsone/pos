function pos_pay_invoice_screens(instance, module) {

    var QWeb = instance.web.qweb;
        _t = instance.web._t;
        round_pr = instance.web.round_precision;

    module.InvoiceScreenWidget = module.ScreenWidget.extend({
        template: 'InvoiceScreenWidget',

        show_numpad: true,
        show_leftpane: true,

        invoice_list_widget: null,

        start: function () {
            var self = this;
            this.invoice_list_widget = new module.InvoiceListWidget(this, {
                click_invoice_action: function(message, amount){
                    self.pos_widget.cash_deposit_popup.create_cash_deposit(message, amount);
                },
                hide_fct: function() {
                    self.pos_widget.screen_selector.set_current_screen('products');
                },
            });
        },

        fetch: function(model, fields, domain, ctx) {
            return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all()
        },

        show: function () {
            this._super();
            var self = this;
            this.$el.find('.close-invoice').off('click').click(function () {
                self.hide_invoice_screen();
            });
            var currentOrder = self.pos.get('selectedOrder');
            var client_id = currentOrder.get_client().id;
            var invoices_list = self.fetch('account.invoice', ['id','partner_id','number','date_invoice','date_due','amount_untaxed','amount_total','residual','origin'], [['commercial_partner_id.id', '=', client_id], ['state', '=', 'open'], ['type', '=', 'out_invoice']]).then(function(invoices) {
                var invoices_list = [];
                for (var i = 0, len = invoices.length; i < len; i++) {
                    invoices_list.push(invoices[i]);
                }
                self.invoice_list_widget.show(invoices_list);
                self.invoice_list_widget.replace($('.placeholder-InvoiceListWidget'));
            }, function (err, event) {
                event.preventDefault();
                self.pos_widget.screen_selector.show_popup('error',{
                    message: _t('Impossible to load the list of invoices'),
                    comment: _t('Check your internet connection and try again.'),
                });
            });
        },

        hide_invoice_screen: function () {
            var self = this;
            self.pos_widget.screen_selector.set_current_screen('products');

        },

    });
}
