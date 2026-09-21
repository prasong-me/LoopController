import SwiftUI

struct ContentView: View {
    @StateObject private var controller = LoopController()

    var body: some View {
        NavigationStack {
            List {
                Section("Profiles") {
                    ForEach(controller.profiles) { profile in
                        Button {
                            controller.select(profile)
                        } label: {
                            HStack {
                                Text(profile.name)
                                Spacer()
                                if profile.id == controller.selectedProfile.id {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                }

                Section("Selected Profile") {
                    Text(controller.selectedProfile.name)
                        .font(.headline)
                    Text(controller.selectedProfile.kind.rawValue)
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button("Start") {
                        Task {
                            try? await controller.startSelectedProfile()
                        }
                    }

                    Button("Stop") {
                        Task {
                            try? await controller.stop()
                        }
                    }
                }
            }
            .navigationTitle("LoopController")
        }
    }
}
