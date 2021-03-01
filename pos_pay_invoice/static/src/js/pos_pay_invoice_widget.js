function pos_pay_invoice_widgets(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    var round_di = instance.web.round_decimals;
    var round_pr = instance.web.round_precision;

    module.PosWidget = module.PosWidget.extend({
        build_widgets: function () {
            this._super();
            this.pay_invoice_screen = new module.InvoiceScreenWidget(this, {});
            this.screen_selector.screen_set.pay_invoice = this.pay_invoice_screen;
            this.pay_invoice_screen.appendTo(this.$('.screens'));
            this.pay_invoice_screen.hide();

        },
    });

    module.ProductCategoriesWidget.include({

        init: function(parent, options) {
            this._super(parent, options);
        },

        renderElement: function () {
            var self = this;
            this._super();
            $('#pay_invoice_button').click(function () {
                var currentOrder = self.pos.get('selectedOrder');
                var cid = currentOrder.get_client() ? currentOrder.get_client().id : 0;
                if (cid != null && cid != 0) {
                    self.pos_widget.screen_selector.set_current_screen('pay_invoice');
                } else {
                    self.pos_widget.screen_selector.show_popup('error', {
                        message: _t('You must select a customer in the order tab first !'),
                        });
                }
            });
        }
    });

    module.InvoiceListWidget = module.PosBaseWidget.extend({
        template: 'InvoiceListWidget',
        invoice_list: null,

        init: function (parent, options) {
            var self = this;
            this._super(parent, options);
            this.invoice_cache = new module.DomCache();

            this.click_invoice_handler = function (e) {
                var self = this;
                window.open(window.location.origin + '/web#id=' + parseInt(this.dataset['invoiceId']) + '&view_type=form&model=account.invoice', '_blank');
                return new instance.web.Model('account.invoice').query(['id','partner_id','number','date_invoice','date_due','amount_untaxed','amount_total','residual','origin']).filter([['id', '=', parseInt(this.dataset['invoiceId'])]]).context(null).all().then(function(invoices) {
                   options.click_invoice_action(_t('POS Invoice Paiment') + ' (' + invoices[0].number + ')', invoices[0].residual);
                   options.hide_fct();
                 });
             };
        },

        start: function () {
        },

        show: function(invoice_list) {
            this.invoice_list = invoice_list;
            this.renderElement();
        },

        render_invoice: function (invoice) {
            invoice.residual = Math.round(invoice.residual*100)/100;
            invoice.amount_total = Math.round(invoice.amount_total*100)/100;
            invoice.amount_untaxed = Math.round(invoice.amount_untaxed*100)/100;
            var cached = this.invoice_cache.get_node(invoice.id);
            if (!cached) {
                var invoice_html = QWeb.render('Invoice', {
                    widget: this,
                    invoice: invoice,
                });
                var invoice_node = $(invoice_html);
                this.invoice_cache.cache_node(invoice.id, invoice_node);
                return invoice_node;
            }
            return cached;
        },

        renderElement: function () {
            var self = this;
            this._super();
            var template = openerp.qweb.render(this.template, {widget: this});
            var list_container = $(template).find('.invoice-list table tbody');
            for (var i = 0, len = this.invoice_list.length; i < len; i++) {
                var invoice_node = this.render_invoice(this.invoice_list[i]);
                $(invoice_node).unbind('click').click(self.click_invoice_handler);
                $(list_container).append(invoice_node);
            }
            $(this.el).find('.invoice-list table tbody').replaceWith($(list_container))

        }
    });
}
