// swift-tools-version: 5.9
import PackageDescription
import AppleProductTypes

let package = Package(
    name: "TravelPlanner",
    platforms: [.iOS("17.0")],
    products: [
        .iOSApplication(
            name: "TravelPlanner",
            targets: ["AppModule"],
            bundleIdentifier: "com.meridian.travelplanner",
            teamIdentifier: "",
            displayVersion: "1.0",
            bundleVersion: "1",
            accentColor: .presetColor(.green),
            supportedDeviceFamilies: [.phone],
            supportedInterfaceOrientations: [.portrait]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "10.29.0")
    ],
    targets: [
        .executableTarget(
            name: "AppModule",
            dependencies: [
                .product(name: "FirebaseCore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFirestoreSwift", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk")
            ],
            path: "Sources",
            resources: [
                .process("Resources")
            ]
        )
    ]
)
