import { Directive, Input, Output, EventEmitter, OnInit, OnDestroy, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Directive({
    selector: '[appCustomCaptcha]',
    standalone: true
})
export class CustomCaptchaDirective implements OnInit, OnDestroy {
    @Input() appCustomCaptchaSiteKey: string = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    @Output() captchaResolved = new EventEmitter<string | null>();

    private templateRef = inject(TemplateRef);
    private viewContainerRef = inject(ViewContainerRef);
    private authService = inject(AuthService);
    private destroy$ = new Subject<void>();
    private widgetId: number | null = null;
    private userRequiresCaptcha: boolean = false;

    ngOnInit(): void {
        this.checkUserCaptcha();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.resetCaptcha();
    }

    private checkUserCaptcha(): void {
        this.authService.getUser()
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.userRequiresCaptcha = (user as any)?.captcha === true;

                // Siempre renderizar el template
                this.viewContainerRef.createEmbeddedView(this.templateRef);

                if (this.userRequiresCaptcha ) {
                    this.createCaptchaContainer();
                } else {
                    this.captchaResolved.emit('no-captcha-required');
                }
            });
    }

    private createCaptchaContainer(): void {
        const viewRoot = this.viewContainerRef.element.nativeElement;
        const container = document.createElement('div');
        container.className = 'recaptcha-container';
        container.style.cssText = 'display: flex; justify-content: center; margin: 20px 0;';

        // Insertar después del template
        if (viewRoot.nextSibling) {
            viewRoot.parentNode.insertBefore(container, viewRoot.nextSibling);
        } else {
            viewRoot.parentNode.appendChild(container);
        }

        this.loadAndRenderCaptcha(container);
    }

    private loadAndRenderCaptcha(container: HTMLElement): void {
        this.loadRecaptchaScript().then(() => {
            this.renderRecaptcha(container);
        }).catch(error => {
            console.error('Error al cargar reCAPTCHA:', error);
        });
    }

    private loadRecaptchaScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).grecaptcha) {
                resolve();
                return;
            }

            const existingScript = document.querySelector('script[src*="recaptcha"]');
            if (existingScript) {
                const checkInterval = setInterval(() => {
                    if ((window as any).grecaptcha) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    if (!(window as any).grecaptcha) {
                        reject(new Error('Timeout esperando reCAPTCHA'));
                    }
                }, 5000);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                setTimeout(() => {
                    if ((window as any).grecaptcha) {
                        resolve();
                    } else {
                        reject(new Error('grecaptcha no disponible'));
                    }
                }, 100);
            };
            script.onerror = () => reject(new Error('Error al cargar reCAPTCHA'));

            document.head.appendChild(script);
        });
    }

    private renderRecaptcha(container: HTMLElement): void {
        if (!(window as any).grecaptcha) {
            console.error('grecaptcha no está disponible');
            return;
        }

        try {
            this.widgetId = (window as any).grecaptcha.render(container, {
                'sitekey': this.appCustomCaptchaSiteKey,
                'callback': (token: string) => {
                    this.onCaptchaResolved(token);
                },
                'expired-callback': () => {
                    this.onCaptchaExpired();
                },
                'error-callback': () => {
                    this.onCaptchaError();
                }
            });
        } catch (error) {
            console.error('Error al renderizar reCAPTCHA:', error);
        }
    }

    private onCaptchaResolved(token: string): void {
        this.captchaResolved.emit(token);
    }

    private onCaptchaExpired(): void {
        this.captchaResolved.emit(null);
    }

    private onCaptchaError(): void {
        this.captchaResolved.emit(null);
    }

    private resetCaptcha(): void {
        if (this.widgetId !== null && (window as any).grecaptcha) {
            try {
                (window as any).grecaptcha.reset(this.widgetId);
            } catch (e) {
                // Ignorar errores
            }
            this.widgetId = null;
        }
    }

    public reset(): void {
        this.resetCaptcha();
        this.captchaResolved.emit(null);
    }
}

