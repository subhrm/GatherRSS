## 🔍 Known Limitations & Future Work

### Current Limitations
1. **No multi-level groups**: Groups are currently depth-1 (can be extended)
2. **No automatic migrations**: Schema changes require manual intervention
3. **Limited article search**: No full-text search indexing (currently client-side filter)
4. **Pagination**: Articles limited to 100 per query (TODO in code)
5. **Background polling interval**: Fixed at 15 minutes (should be configurable)

### Planned Features (from product-spec.md)
- [ ] Full-text search with indexing
- [ ] Nested group support (infinite depth)
- [ ] Export individual articles to PDF
- [ ] Social sharing integrations
- [ ] Configurable sync intervals
- [ ] Smart notifications with quiet hours
- [ ] Typography controls (font size, family, line height)
- [ ] Light mode theme