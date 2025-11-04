# ⚡ Performance Optimization - Quick Start Guide

## 🚀 How to Run with Performance Monitoring

### 1. Build the Project

```bash
npm run build
```

### 2. Run with Performance Report

```bash
npm start
```

### 3. View Performance Report

The performance report will automatically display at the end:

```
⏱️  PERFORMANCE REPORT
================================================================================

1. Validate Input Data                        12ms   0.1% [█░░░░░░░░░░░░░░░░░░░]
2. Validate Template                           45ms   0.3% [██░░░░░░░░░░░░░░░░░░]
3. Load Template PDF                         1.23s   9.5% [████░░░░░░░░░░░░░░░░]
4. Map Data                                   67ms   0.5% [██░░░░░░░░░░░░░░░░░░]
5. Fill Header Fields                         89ms   0.7% [███░░░░░░░░░░░░░░░░░]
6. Flatten Form                              234ms   1.8% [████░░░░░░░░░░░░░░░░]
7. Remove Template Pages                      23ms   0.2% [█░░░░░░░░░░░░░░░░░░░]
8. Build Inspection Pages                    8.45s  65.2% [████████████████████]
9. Prepare Output Directory                   12ms   0.1% [█░░░░░░░░░░░░░░░░░░░]
10. Save PDF                                 2.78s  21.4% [████████░░░░░░░░░░░░]
11. Validate Output                           89ms   0.7% [███░░░░░░░░░░░░░░░░░]

────────────────────────────────────────────────────────────────────────────────
TOTAL EXECUTION TIME:                       12.95s
================================================================================
```

---

## 🎯 Key Performance Features

### ✅ Automatic Image Caching
- **First run**: Images downloaded and cached
- **Subsequent runs**: Images served from cache (10x faster!)

### ✅ Parallel Image Downloads
- Downloads 10 images at a time (instead of one at a time)
- **Speedup**: 5-10x faster than sequential

### ✅ Detailed Timing Breakdown
- See exactly where time is spent
- Visual progress bars
- Percentage of total time

---

## 📊 Expected Performance

| Run Type | Time | Description |
|----------|------|-------------|
| **First Run** | 8-12s | Images downloaded and cached |
| **Cached Run** | 3-5s | Images served from cache |
| **Large Reports** | 15-20s | 200+ items, 100+ images |

---

## 🧹 Clear Cache (Force Re-download)

```bash
rm -rf cache/images
```

Then run `npm start` to re-download all images.

---

## 🎛️ Configuration Options

### Increase Memory Cache Size

Edit `src/utils/ImageCache.ts`:
```typescript
private maxMemoryCacheSize = 100 * 1024 * 1024; // 100MB
```

### Increase Parallel Download Batch Size

Edit `src/services/TRECPageBuilder.ts`:
```typescript
const batchSize = 20; // Download 20 images at a time
```

---

## 🐛 Troubleshooting

### Cache Directory Not Created?
```bash
mkdir -p cache/images
```

### Performance Report Not Showing?
Check console output - it should appear after "TREC PDF generation complete!"

### Slow Performance?
1. Clear cache: `rm -rf cache/images`
2. Check network connection
3. Reduce batch size if running out of memory

---

## 📈 Performance Monitoring Details

### Phase Timing
Each phase is automatically timed:
- Validation
- Template loading
- Data mapping
- Form filling
- Page building
- PDF saving

### Visual Progress Bars
- `█` = filled portion (percentage of total time)
- `░` = empty portion
- Length proportional to execution time

### Time Format
- `ms` = milliseconds (< 1 second)
- `s` = seconds (< 1 minute)
- `m` = minutes (1+ minute)

---

## 🎉 Success Indicators

✅ **Good Performance**:
- First run: 8-12 seconds
- Cached run: 3-5 seconds
- "Downloaded batch X/Y" messages appear
- Cache directory populated: `ls cache/images/`

⚠️ **Needs Investigation**:
- First run: > 20 seconds
- Cached run: > 10 seconds
- No cache messages
- Empty cache directory

---

## 💡 Tips for Best Performance

1. **Keep cache**: Don't delete `cache/images/` between runs
2. **Network**: Use fast, stable internet for first run
3. **Memory**: Ensure at least 100MB free RAM
4. **Batch jobs**: Run multiple reports in sequence (cache benefits)

---

## 📚 More Information

- Full details: `PERFORMANCE_OPTIMIZATION_COMPLETE.md`
- Code examples: See optimized files in `src/`
- Architecture: `README.md`

---

**Run Now**: `npm start` 🚀

