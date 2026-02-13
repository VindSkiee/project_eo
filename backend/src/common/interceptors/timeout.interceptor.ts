import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler, 
  RequestTimeoutException 
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const TIMEOUT_MS = 15000; // 15 Detik (Sesuaikan dengan kebutuhan bisnis)

    return next.handle().pipe(
      timeout(TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          // Jika proses melebihi batas waktu, otomatis batalkan dan lempar error 408
          return throwError(() => new RequestTimeoutException('Request Timeout: Proses terlalu lama'));
        }
        return throwError(() => err);
      }),
    );
  }
}