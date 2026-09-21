import Foundation

/// Original LoopController adapter.
/// Native JSON export used for backup, sharing and future import/export.
struct LoopControllerExporter {
    func export(_ profile: NetworkProfile) throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(profile)
    }

    func exportString(_ profile: NetworkProfile) throws -> String {
        String(data: try export(profile), encoding: .utf8) ?? "{}"
    }
}
