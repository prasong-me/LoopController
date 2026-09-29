import Foundation

enum ConfigurationTarget: String, CaseIterable, Codable {
    case loopController = "loopcontroller"
    case surge
    case rocketProxy = "rocket-proxy"
}

struct ExportArtifact {
    let target: ConfigurationTarget
    let filename: String
    let mimeType: String
    let data: Data
    let warnings: [String]
}

enum ExportError: Error, LocalizedError {
    case unsupportedTarget
    case invalidArtifact
    case encodingFailed

    var errorDescription: String? {
        switch self {
        case .unsupportedTarget: return "The selected configuration target is not supported."
        case .invalidArtifact: return "The exporter returned an invalid artifact."
        case .encodingFailed: return "The configuration could not be encoded as UTF-8."
        }
    }
}

protocol ConfigurationExporter {
    var target: ConfigurationTarget { get }
    func export(_ profile: NetworkProfile) throws -> ExportArtifact
}

struct LoopControllerConfigurationExporter: ConfigurationExporter {
    let target: ConfigurationTarget = .loopController

    func export(_ profile: NetworkProfile) throws -> ExportArtifact {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(profile)
        return ExportArtifact(
            target: target,
            filename: "(safeName(profile.name)).loopcontroller.json",
            mimeType: "application/json",
            data: data,
            warnings: []
        )
    }
}

struct SurgeConfigurationExporter: ConfigurationExporter {
    let target: ConfigurationTarget = .surge

    func export(_ profile: NetworkProfile) throws -> ExportArtifact {
        let text = SurgeExporter().export(profile)
        guard let data = text.data(using: .utf8) else { throw ExportError.encodingFailed }
        return ExportArtifact(
            target: target,
            filename: "(safeName(profile.name)).conf",
            mimeType: "text/plain",
            data: data,
            warnings: profile.blocking.enabled ? ["Blocking categories are represented as requests/comments; target rule-set resources are not generated automatically."] : []
        )
    }
}

struct RocketProxyConfigurationExporter: ConfigurationExporter {
    let target: ConfigurationTarget = .rocketProxy

    func export(_ profile: NetworkProfile) throws -> ExportArtifact {
        let text = RocketProxyExporter().export(profile)
        guard let data = text.data(using: .utf8) else { throw ExportError.encodingFailed }
        return ExportArtifact(
            target: target,
            filename: "(safeName(profile.name)).yaml",
            mimeType: "text/yaml",
            data: data,
            warnings: profile.blocking.enabled ? ["Blocking categories require explicitly selected rule providers; none are embedded automatically."] : []
        )
    }
}

struct ConfigurationExportService {
    private let exporters: [ConfigurationTarget: any ConfigurationExporter] = [
        .loopController: LoopControllerConfigurationExporter(),
        .surge: SurgeConfigurationExporter(),
        .rocketProxy: RocketProxyConfigurationExporter()
    ]

    func export(_ profile: NetworkProfile, target: ConfigurationTarget) throws -> ExportArtifact {
        guard let exporter = exporters[target] else { throw ExportError.unsupportedTarget }
        let artifact = try exporter.export(profile)
        guard !artifact.data.isEmpty, !artifact.filename.isEmpty else { throw ExportError.invalidArtifact }
        return artifact
    }

    func availableTargets() -> [ConfigurationTarget] {
        ConfigurationTarget.allCases.filter { exporters[$0] != nil }
    }
}

private func safeName(_ value: String) -> String {
    let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_."))
    return value.unicodeScalars.map { allowed.contains($0) ? String($0) : "_" }.joined()
}
