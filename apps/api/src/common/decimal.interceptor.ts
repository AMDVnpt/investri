import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map } from "rxjs";
import { Prisma } from "@investri/database";

function serialize(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return value.toFixed();
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serialize(nested)]),
    );
  }
  return value;
}

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((data) => serialize(data)));
  }
}
