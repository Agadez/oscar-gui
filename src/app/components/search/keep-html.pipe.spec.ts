import { KeepHtmlPipe } from './keep-html.pipe';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
  SafeScript,
  SafeValue,
  SafeStyle,
  SafeUrl,
} from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

class SampleDomSanitizer extends DomSanitizer {
  sanitize(
    context: SecurityContext,
    value: SafeValue | string | null
  ): string | null {
    throw new Error('Method not implemented.');
  }
  bypassSecurityTrustHtml(value: string): SafeHtml {
    throw new Error('Method not implemented.');
  }
  bypassSecurityTrustStyle(value: string): SafeStyle {
    throw new Error('Method not implemented.');
  }
  bypassSecurityTrustScript(value: string): SafeScript {
    throw new Error('Method not implemented.');
  }
  bypassSecurityTrustUrl(value: string): SafeUrl {
    throw new Error('Method not implemented.');
  }
  bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl {
    throw new Error('Method not implemented.');
  }
}

describe('KeepHtmlPipe', () => {
  it('create an instance', () => {
    const pipe = new KeepHtmlPipe(new SampleDomSanitizer());
    expect(pipe).toBeTruthy();
  });
});
