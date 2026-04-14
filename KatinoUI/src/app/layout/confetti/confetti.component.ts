import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';

interface ConfettiPiece {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  speedX: number;
  speedY: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'ribbon';
  wobble: number;
  wobbleSpeed: number;
}

@Component({
  selector: 'app-confetti',
  template: `<canvas #confettiCanvas class="confetti-canvas"></canvas>`,
  styles: [
    `
      .confetti-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfettiComponent implements AfterViewInit, OnDestroy {
  @ViewChild('confettiCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private pieces: ConfettiPiece[] = [];
  private animFrameId = 0;
  private readonly PIECE_COUNT = 80;
  private readonly COLORS = [
    '#f9a8d4', // pink
    '#fbbf24', // amber
    '#a78bfa', // violet
    '#34d399', // emerald
    '#60a5fa', // blue
    '#f87171', // red
    '#fb923c', // orange
    '#e879f9', // fuchsia
  ];

  public ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize(canvas);
    window.addEventListener('resize', () => this.resize(canvas));
    this.spawnPieces(canvas);
    this.animate(canvas);
  }

  public ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', () =>
      this.resize(this.canvasRef.nativeElement),
    );
  }

  private resize(canvas: HTMLCanvasElement): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private createPiece(
    canvas: HTMLCanvasElement,
    startY?: number,
  ): ConfettiPiece {
    const shapes: ConfettiPiece['shape'][] = ['rect', 'circle', 'ribbon'];
    return {
      x: this.randomBetween(0, canvas.width),
      y: startY !== undefined ? startY : this.randomBetween(-100, -10),
      size: this.randomBetween(5, 10),
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      rotation: this.randomBetween(0, Math.PI * 2),
      rotationSpeed: this.randomBetween(-0.03, 0.03),
      speedX: this.randomBetween(-0.4, 0.4),
      speedY: this.randomBetween(0.6, 1.4),
      opacity: this.randomBetween(0.55, 0.85),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      wobble: this.randomBetween(0, Math.PI * 2),
      wobbleSpeed: this.randomBetween(0.01, 0.03),
    };
  }

  private spawnPieces(canvas: HTMLCanvasElement): void {
    // Initial pieces spread across the full height so screen isn't empty at start
    for (let i = 0; i < this.PIECE_COUNT; i++) {
      const piece = this.createPiece(canvas);
      piece.y = this.randomBetween(-canvas.height, canvas.height * 0.5);
      this.pieces.push(piece);
    }
  }

  private drawPiece(piece: ConfettiPiece): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = piece.opacity;
    ctx.fillStyle = piece.color;
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);

    switch (piece.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ribbon':
        ctx.fillRect(
          -piece.size / 2,
          -piece.size * 0.15,
          piece.size,
          piece.size * 0.3,
        );
        break;
      case 'rect':
      default:
        ctx.fillRect(
          -piece.size / 2,
          -piece.size / 2,
          piece.size,
          piece.size * 0.6,
        );
        break;
    }

    ctx.restore();
  }

  private animate(canvas: HTMLCanvasElement): void {
    const tick = () => {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = this.pieces.length - 1; i >= 0; i--) {
        const p = this.pieces[i];

        p.wobble += p.wobbleSpeed;
        p.x += p.speedX + Math.sin(p.wobble) * 0.3;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        this.drawPiece(p);

        // Recycle piece when it goes below screen
        if (p.y > canvas.height + 20) {
          this.pieces[i] = this.createPiece(canvas);
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }
}
