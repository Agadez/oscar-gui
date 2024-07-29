import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanReadableNumbersPipe',
})
export class HumanReadableNumbersPipePipe implements PipeTransform {
  mymap = ['', 'K', 'M', 'B', 'T'];
  transform(value: number, ...args: unknown[]): string {
    const str = value.toString();
    if (str.length < 4) {
      return str;
    }
    const length = Math.floor((str.length - 1) / 3);
    const trimmedValue = value / Math.pow(10, length * 3);
    return (
      Number(trimmedValue.toString(10)).toFixed(1) + ' ' + this.mymap[length]
    );
  }
}
