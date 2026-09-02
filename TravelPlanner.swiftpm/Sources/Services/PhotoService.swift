import SwiftUI
import FirebaseStorage

/// Photos attached to a log note live in Cloud Storage under the signed-in
/// uid; the note itself only stores paths.
struct PhotoService {

    static func path(uid: String, tripID: String, dayNumber: Int) -> String {
        "users/\(uid)/trips/\(tripID)/log/day-\(dayNumber)/\(UUID().uuidString).jpg"
    }

    static func upload(_ data: Data, to path: String) async throws {
        let metadata = StorageMetadata()
        metadata.contentType = "image/jpeg"
        _ = try await Storage.storage().reference(withPath: path).putDataAsync(data, metadata: metadata)
    }

    static func downloadURL(for path: String) async throws -> URL {
        try await Storage.storage().reference(withPath: path).downloadURL()
    }
}

/// Thumbnail for a photo that lives in Cloud Storage.
struct StoragePhoto: View {
    let path: String

    @State private var url: URL?

    var body: some View {
        ZStack {
            if let url {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    case .failure:
                        PhotoPlaceholder(label: nil, radius: 0)
                    default:
                        PhotoPlaceholder(label: nil, radius: 0)
                    }
                }
            } else {
                PhotoPlaceholder(label: nil, radius: 0)
            }
        }
        .clipped()
        .task {
            url = try? await PhotoService.downloadURL(for: path)
        }
    }
}
