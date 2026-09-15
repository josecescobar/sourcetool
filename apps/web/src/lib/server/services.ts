import { AiService } from './ai/ai.service';
import { AlertsService } from './alerts/alerts.service';
import { AnalysisService } from './analysis/analysis.service';
import { ProfitCalculatorEngine } from './analysis/engines/profit-calculator.engine';
import { AnalyticsService } from './analytics/analytics.service';
import { AuthService } from './auth/auth.service';
import { BillingService } from './billing/billing.service';
import { BulkScanService } from './bulk-scan/bulk-scan.service';
import { BuyListsService } from './buy-lists/buy-lists.service';
import { EmailService } from './email/email.service';
import { ExportService } from './export/export.service';
import { HistoryService } from './history/history.service';
import { AmazonSpApiAuthService } from './integrations/amazon-sp-api/amazon-sp-api.auth';
import { AmazonSpApiService } from './integrations/amazon-sp-api/amazon-sp-api.service';
import { KeepaService } from './integrations/keepa/keepa.service';
import { ProductDataChainService } from './integrations/product-data-chain.service';
import { RainforestService } from './integrations/rainforest/rainforest.service';
import { ProductWatchesService } from './product-watches/product-watches.service';
import { WatchCheckerService } from './product-watches/watch-checker.service';
import { ProductsService } from './products/products.service';
import { SavedSearchesService } from './saved-searches/saved-searches.service';
import { SourcedProductsService } from './sourced-products/sourced-products.service';
import { TeamsService } from './teams/teams.service';

export const rainforestService = new RainforestService();
export const keepaService = new KeepaService();
export const amazonSpApiAuthService = new AmazonSpApiAuthService();
export const amazonSpApiService = new AmazonSpApiService(amazonSpApiAuthService);
export const productDataChainService = new ProductDataChainService(
  rainforestService,
  keepaService,
  amazonSpApiService,
);

export const emailService = new EmailService();
export const aiService = new AiService();
export const profitCalculatorEngine = new ProfitCalculatorEngine();
export const analysisService = new AnalysisService(profitCalculatorEngine);
export const productWatchesService = new ProductWatchesService();
export const productsService = new ProductsService(
  productDataChainService,
  productWatchesService,
  aiService,
);
export const bulkScanService = new BulkScanService(productsService, analysisService, aiService);
export const watchCheckerService = new WatchCheckerService(
  productDataChainService,
  productWatchesService,
);
export const authService = new AuthService(emailService);
export const teamsService = new TeamsService(emailService);
export const billingService = new BillingService();
export const historyService = new HistoryService();
export const alertsService = new AlertsService();
export const analyticsService = new AnalyticsService();
export const buyListsService = new BuyListsService();
export const exportService = new ExportService();
export const sourcedProductsService = new SourcedProductsService();
export const savedSearchesService = new SavedSearchesService();
