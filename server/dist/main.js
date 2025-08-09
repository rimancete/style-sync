"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map