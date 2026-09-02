import SwiftUI
import UIKit

/// Screen 2f — 购物清单. Estimates are optional; the real price is entered
/// after ticking, and only ticked items count towards spend. Ticking stamps
/// the date, unticking clears it.
struct ShopView: View {
    @EnvironmentObject private var store: TripStore

    @State private var addOpen = false
    @State private var newName = ""
    @State private var newPlace = ""
    @State private var newEstimate = ""
    @State private var newPayment: PaymentMethod = .cash

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(spacing: 14) {
                    if addOpen { addForm }
                    ForEach(store.shoppingGroups) { group in
                        ShoppingGroupCard(group: group)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 260)
            }
        }
        .background(Palette.bone)
        .toolbar(.hidden, for: .navigationBar)
        .overlay(alignment: .bottom) { footer }
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .bottom, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Shopping list")
                    .font(Typo.screenTitle())
                Text("\(store.shopping.count) items · \(store.shoppingGroups.count) places")
                    .font(.system(size: 12))
                    .foregroundStyle(Palette.muted)
            }
            Spacer(minLength: 0)
            Button {
                addOpen.toggle()
            } label: {
                Text(addOpen ? "Close" : "+ Add")
                    .font(.system(size: 12.5, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 13)
                    .frame(height: 38)
                    .background(Palette.ink, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle().fill(Palette.border).frame(height: 1)
        }
    }

    // MARK: Add form

    private var addForm: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Add an item")
                .font(.system(size: 12.5, weight: .heavy))
                .padding(.bottom, 2)

            field("What is it?", text: $newName)

            // Where you buy it is a dropdown of your own stops, not free text.
            Picker("Where", selection: $newPlace) {
                Text("Choose a place (main or sub route)").tag("")
                ForEach(store.shoppingPlaceOptions, id: \.self) { option in
                    Text(option).tag(option)
                }
            }
            .pickerStyle(.menu)
            .tint(Palette.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            .frame(height: 40)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Palette.field, lineWidth: 1)
            }

            field("Estimated price (optional)", text: $newEstimate, keyboard: .decimalPad)

            HStack(spacing: 5) {
                ForEach(PaymentMethod.allCases, id: \.self) { method in
                    let isOn = newPayment == method
                    Button {
                        newPayment = method
                    } label: {
                        Text(method.label)
                            .font(.system(size: 11.5, weight: .bold))
                            .foregroundStyle(isOn ? .white : Palette.muted)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(isOn ? Palette.ink : Color.white,
                                        in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                            .overlay {
                                RoundedRectangle(cornerRadius: 9, style: .continuous)
                                    .strokeBorder(isOn ? Palette.ink : Palette.field, lineWidth: 1)
                            }
                    }
                    .buttonStyle(.plain)
                }
            }

            HStack(spacing: 8) {
                Button(action: save) {
                    Text("Save")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 42)
                        .background(Palette.jade, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(newName.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)

                Button {
                    addOpen = false
                    reset()
                } label: {
                    Text("Cancel")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(Palette.charcoal)
                        .frame(width: 96, height: 42)
                        .background(Palette.bone, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
                .buttonStyle(.plain)
            }
            .padding(.top, 2)

            Text("Estimated price is optional. The real price is entered after you tick the item, and only ticked items count towards spend.")
                .font(.system(size: 11))
                .foregroundStyle(Palette.soft)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Palette.ink, lineWidth: 1.5)
        }
    }

    private func field(_ placeholder: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        TextField(placeholder, text: text)
            .textFieldStyle(.plain)
            .font(.system(size: 13))
            .keyboardType(keyboard)
            .padding(.horizontal, 10)
            .frame(height: 40)
            .background(Color.white, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Palette.field, lineWidth: 1)
            }
    }

    private func save() {
        let cleaned = newEstimate.filter { $0.isNumber || $0 == "." }
        store.addShoppingItem(
            name: newName.trimmingCharacters(in: .whitespacesAndNewlines),
            placeLabel: newPlace,
            estimate: cleaned.isEmpty ? nil : Double(cleaned),
            payment: newPayment
        )
        addOpen = false
        reset()
    }

    private func reset() {
        newName = ""
        newPlace = ""
        newEstimate = ""
        newPayment = .cash
    }

    // MARK: Footer

    private var footer: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .bottom, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("ACTUAL SPEND")
                        .sectionLabelStyle()
                    HStack(alignment: .firstTextBaseline, spacing: 6) {
                        Text(Fmt.money(store.totalSpent, symbol: symbol))
                            .font(.system(size: 20, weight: .bold))
                            .monospacedDigit()
                        Text("/ \(Fmt.money(store.totalPlanned, symbol: symbol)) est.")
                            .font(.system(size: 11.5, weight: .semibold))
                            .foregroundStyle(Palette.muted)
                    }
                }
                Spacer(minLength: 0)
                VStack(alignment: .trailing, spacing: 2) {
                    Text("≈ \(store.trip?.homeCurrencyCode ?? "")")
                        .font(.system(size: 10.5, weight: .heavy))
                        .foregroundStyle(Palette.soft)
                    Text(store.homeCurrencyLabel)
                        .font(.system(size: 14, weight: .bold))
                }
            }

            ProgressTrack(value: store.spendProgress)
                .padding(.top, 9)

            Text("\(store.boughtCount) of \(store.shopping.count) bought")
                .font(.system(size: 10.5, weight: .semibold))
                .foregroundStyle(Palette.muted)
                .padding(.top, 6)

            Text("BY PAYMENT METHOD")
                .sectionLabelStyle()
                .padding(.top, 10)

            HStack(spacing: 5) {
                ForEach(store.spendByMethod) { entry in
                    Chip(
                        label: "\(entry.method.label) · \(entry.count) × \(Fmt.money(entry.total, symbol: symbol))",
                        background: entry.count > 0 ? Palette.jadeSoft : Palette.bone,
                        foreground: entry.count > 0 ? Palette.jade : Palette.soft
                    )
                }
            }
            .padding(.top, 6)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Palette.border, lineWidth: 1)
        }
        .shadow(color: Color.black.opacity(0.16), radius: 13, y: 6)
        .padding(.horizontal, 12)
        .padding(.bottom, 92)
    }

    private var symbol: String { store.trip?.currencySymbol ?? "¥" }
}

// MARK: - Group card

private struct ShoppingGroupCard: View {
    @EnvironmentObject private var store: TripStore
    let group: ShoppingGroup

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(group.placeLabel)
                        .font(.system(size: 14, weight: .bold))
                    Text(group.when)
                        .font(.system(size: 11))
                        .foregroundStyle(Palette.muted)
                }
                Spacer(minLength: 0)
                if let badge = group.badge.label {
                    Chip(
                        label: badge,
                        background: group.badge == .lastChance ? Color(hex: 0xF4E4E4) : Palette.rule,
                        foreground: group.badge == .lastChance ? Palette.danger : Palette.soft,
                        size: 10
                    )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            ForEach(group.items) { item in
                ShoppingItemRow(item: item)
            }
        }
        .cardSurface()
    }
}

private struct ShoppingItemRow: View {
    @EnvironmentObject private var store: TripStore
    let item: ShoppingItem

    @State private var paidText = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Rectangle().fill(Palette.hairline).frame(height: 1)

            HStack(spacing: 11) {
                Button {
                    store.toggleBought(item)
                } label: {
                    Checkbox(isOn: item.bought)
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 2) {
                    Text(item.name)
                        .font(.system(size: 13.5, weight: .semibold))
                        .strikethrough(item.bought)
                        .foregroundStyle(item.bought ? Palette.strike : Palette.ink)
                    if !item.detail.isEmpty {
                        Text(item.detail)
                            .font(.system(size: 11))
                            .foregroundStyle(Palette.soft)
                    }
                }

                Spacer(minLength: 0)

                VStack(alignment: .trailing, spacing: 1) {
                    Text(item.estimate.map { Fmt.money($0, symbol: symbol) } ?? "—")
                        .font(.system(size: 12, weight: .bold))
                        .monospacedDigit()
                        .foregroundStyle(Palette.soft)
                    Text("est.")
                        .font(.system(size: 9.5))
                        .foregroundStyle(Palette.faint)
                }
            }
            .padding(.top, 11)

            HStack(spacing: 6) {
                Button {
                    store.cyclePayment(item)
                } label: {
                    Chip(label: item.payment.label, background: Palette.hairline, foreground: Palette.charcoal)
                }
                .buttonStyle(.plain)

                if item.bought {
                    Text("PAID")
                        .font(.system(size: 10.5, weight: .heavy))
                        .foregroundStyle(Palette.jade)
                    TextField("What you paid", text: $paidText)
                        .textFieldStyle(.plain)
                        .font(.system(size: 12))
                        .keyboardType(.decimalPad)
                        .padding(.horizontal, 8)
                        .frame(height: 30)
                        .background(Color(hex: 0xF7FBF9), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: 9, style: .continuous)
                                .strokeBorder(Palette.jadeSoftBorder, lineWidth: 1)
                        }
                        .onChange(of: paidText) { _, new in
                            store.setPaid(item, text: new)
                        }
                }
                Spacer(minLength: 0)
            }
            .padding(.top, 8)
            .padding(.leading, 33)

            if item.bought, let stamp = item.boughtOn {
                Text("Bought \(Fmt.stamp(stamp))")
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundStyle(Palette.soft)
                    .padding(.top, 6)
                    .padding(.leading, 33)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 11)
        .onAppear {
            paidText = item.paidAmount.map { String(Fmt.boundedInt($0)) } ?? ""
        }
    }

    private var symbol: String { store.trip?.currencySymbol ?? "¥" }
}
